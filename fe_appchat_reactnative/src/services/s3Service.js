import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "@env";

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-southeast-2",
});

export const uploadFileToS3 = async (uri, fileType) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = uri.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    
    // Add folder structure based on file type
    const folder = fileType === 'video' ? 'videos' : 
                  fileType === 'image' ? 'images' : 'files';
    
    const params = {
      Bucket: "bucket-zele",
      Key: `${folder}/${fileName}`,
      Body: blob,
      ContentType: blob.type,
      ACL: "public-read",
    };

    const uploadResponse = await s3.upload(params).promise();
    console.log("Upload successful, URL:", uploadResponse.Location);

    return {
      url: uploadResponse.Location,
      fileName: fileName,
      fileType: blob.type,
      fileSize: blob.size
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
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
