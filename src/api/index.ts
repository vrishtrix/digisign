import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { sign as signJWT } from 'hono/jwt';
import { PDFDocument } from 'pdf-lib';

import db from '@/db/client';
import { certificates, customers } from '@/db/schema';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { P12Signer } from '@signpdf/signer-p12';
import signpdf from '@signpdf/signpdf';

import type {
	LoginRequestParams,
	PfxUploadRequestParams,
	SignPdfRequestParams,
	SignupRequestParams,
} from '@/types';
type Bindings = {
	JWT_SECRET: string;
};

const api = new Hono<{ Bindings: Bindings }>();

// TODO: Create middleware to check 'Content-Type' header

api.post('/customer/signup', async (ctx) => {
	if (!ctx.req.header('Content-Type')?.includes('application/json')) {
		ctx.status(415);
		return ctx.body(
			'This endpoint only supports the application/json content type.',
		);
	}

	const { email, password, confirmPassword, firstName, lastName } =
		await ctx.req.json<SignupRequestParams>(); // TODO: use req.valid() and validate fields before working with them

	if (password !== confirmPassword) {
		ctx.status(400);
		return ctx.body('Password and Confirm Password do not match');
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const user = await db
		.select()
		.from(customers)
		.where(eq(customers.email, email));

	if (user.length !== 0) {
		ctx.status(409);
		return ctx.body('User already exists.');
	}

	db.insert(customers).values({
		email,
		firstName,
		lastName,
		password: hashedPassword,
	});

	return ctx.body('User created successfully!');
});

api.post('/customer/login', async (ctx) => {
	if (!ctx.req.header('Content-Type')?.includes('application/json')) {
		ctx.status(415);
		return ctx.body(
			'This endpoint only supports the application/json content type.',
		);
	}

	const { email, password } = await ctx.req.json<LoginRequestParams>(); // TODO: use req.valid() and validate fields before working with them

	const user = await db
		.select()
		.from(customers)
		.where(eq(customers.email, email));

	if (user.length === 0) {
		return ctx.body('User does not exist.');
	}

	if (!(await bcrypt.compare(password, user[0].password))) {
		return ctx.body('Invalid password');
	}

	const token = await signJWT(
		{
			email: user[0].email,
			exp: Math.floor(Date.now() / 1000) + 60 * 30,
		},
		env(ctx).JWT_SECRET,
	);

	return ctx.body(token);
});

api.post('/digisign/uploadpfx', async (ctx) => {
	if (!ctx.req.header('Content-Type')?.includes('multipart/form-data')) {
		ctx.status(415);
		return ctx.body(
			'This endpoint only supports the multipart/form-data content type.',
		);
	}

	const { file, fileType } =
		await ctx.req.parseBody<PfxUploadRequestParams>();

	const fileAsBaseEncodedStr = Buffer.from(await file.arrayBuffer()).toString(
		'base64',
	);

	const { email } = ctx.get('jwtPayload');

	const user = await db
		.select()
		.from(customers)
		.where(eq(customers.email, email));

	const cert = await db
		.insert(certificates)
		.values({
			belongsTo: user[0].id,
			value: fileAsBaseEncodedStr,
		})
		.returning({ insertedId: certificates.id });

	return ctx.body(cert[0].insertedId);
});

api.post('/digisign/signpdf', async (ctx) => {
	if (!ctx.req.header('Content-Type')?.includes('multipart/form-data')) {
		ctx.status(415);
		return ctx.body(
			'This endpoint only supports the multipart/form-data content type.',
		);
	}

	const {
		file,
		signReason,
		signLocation,
		pointX,
		pointY,
		signHeight,
		signWidth,
		pfxId,
		pfxPassword,
	} = await ctx.req.parseBody<SignPdfRequestParams>();

	const { email } = ctx.get('jwtPayload');

	const user = await db
		.select()
		.from(customers)
		.where(eq(customers.email, email));

	const certificate = await db
		.select()
		.from(certificates)
		.where(
			and(
				eq(certificates.belongsTo, user[0].id),
				eq(certificates.id, pfxId),
			),
		);

	if (certificate.length === 0) {
		return ctx.body('Certificate does not exist');
	}

	const pdfBuffer = await file.arrayBuffer();
	const certificateBuffer = Buffer.from(certificate[0].value, 'base64');

	const pdfDoc = await PDFDocument.load(pdfBuffer);

	const widgetRect = [
		Number.parseInt(pointX),
		Number.parseInt(pointY),
		Number.parseInt(signHeight),
		Number.parseInt(signWidth),
	];

	pdflibAddPlaceholder({
		pdfDoc,
		reason: signReason ?? '',
		location: signLocation ?? '',
		contactInfo: '',
		name: '',
		widgetRect,
		signatureLength: 12580,
	});

	const pdfWithPlaceholderBytes = await pdfDoc.save();

	try {
		const signer = new P12Signer(certificateBuffer, {
			passphrase: pfxPassword,
		});

		const signedPdf = await signpdf.sign(pdfWithPlaceholderBytes, signer);
		return ctx.body(signedPdf.toString('base64'), 201);
	} catch (err) {
		return ctx.body('PFX password invalid.');
	}
});

export default api;
