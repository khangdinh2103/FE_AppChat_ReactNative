import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "@env";

// Configure AWS with credentials from environment variables
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-southeast-2"
});

const s3 = new AWS.S3();

export const uploadFileToS3 = async (uri, fileType) => {
  try {
    console.log("Starting S3 upload process for:", uri);
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const extension = uri.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;

    console.log("Prepared file for upload:", {
      fileName,
      fileSize: blob.size,
      fileType: blob.type
    });

    const params = {
      Bucket: "bucket-zele",
      Key: fileName,
      Body: blob,
      ContentType: blob.type,
      ACL: "public-read",
    };

    const uploadResponse = await s3.upload(params).promise();
    console.log("Upload thành công, URL:", uploadResponse.Location);

    return {
      url: uploadResponse.Location,
      fileName: fileName,
      fileType: blob.type,
      fileSize: blob.size
    };
  } catch (error) {
    console.error("Lỗi upload lên S3:", error);
    throw error;
  }
};

export const uploadImageToS3 = async (uri) => {
  try {
    const fileData = await uploadFileToS3(uri, 'image');
    return fileData.url;
  } catch (error) {
    console.error("Lỗi upload ảnh lên S3:", error);
    throw error;
  }
};