type FileType = '1' | '2' | '3';

export type SignupRequestParams = {
	email: string;
	password: string;
	confirmPassword: string;
	firstName: string;
	lastName: string;
};

export type LoginRequestParams = {
	email: string;
	password: string;
};

export type PfxUploadRequestParams = {
	file: File;
	fileType: FileType;
};

export type SignPdfRequestParams = {
	file: File;
	fileType: FileType;
	signLocation?: string;
	signReason?: string;
	pointX: string;
	pointY: string;
	signHeight: string;
	signWidth: string;
	pfxId: string;
	signOnPage: 'F' | 'L' | 'A';
	pfxPassword: string;
};
