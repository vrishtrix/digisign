import { Hono } from 'hono';
import { PDFDocument } from 'pdf-lib';

import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { P12Signer } from '@signpdf/signer-p12';
import signpdf from '@signpdf/signpdf';

import type { SignPdfRequestParams } from '@/types';

const api = new Hono();

api.post('/customer/signup', (ctx) => {
	return ctx.body('Signup successful');
});

api.post('/customer/login', (ctx) => {
	return ctx.body('Login successful');
});

api.post('/digisign/uploadpfx', (ctx) => {
	return ctx.body('PFX Fule upload successful');
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
		pfxPassword,
	} = await ctx.req.parseBody<SignPdfRequestParams>();

	const pdfBuffer = await file.arrayBuffer();
	const certificateBuffer = Buffer.from('', 'base64'); // TODO: Replace with actual certificate

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

	const signer = new P12Signer(certificateBuffer, {
		passphrase: pfxPassword,
	});
	const signedPdf = await signpdf.sign(pdfWithPlaceholderBytes, signer);

	return ctx.body(signedPdf.toString('base64'), 201);
});

export default api;
