import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const uploadFileToS3 = async (file, folderName) => {
    const fileName = `${Date.now().toString()}-${file.originalname}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${folderName}/${fileName}`,  
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
    } catch (error) {
        throw new Error(`Failed to upload to S3: ${error.message}`);
    }
};
