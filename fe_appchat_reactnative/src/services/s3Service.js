import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "@env";

console.log("hi", AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY);
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-southeast-2",
});

export const uploadImageToS3 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      throw new Error("File không phải là ảnh hợp lệ");
    }

    const fileName = `${uuidv4()}.jpg`;

    const params = {
      Bucket: "bucket-zele",
      Key: fileName,
      Body: blob,
      ContentType: blob.type,
      ACL: "public-read",
    };

    const uploadResponse = await s3.upload(params).promise();
    console.log("Upload thành công, URL:", uploadResponse.Location);

    const checkResponse = await fetch(uploadResponse.Location);
    if (!checkResponse.ok) {
      throw new Error("Không thể truy cập ảnh sau khi upload");
    }

    return uploadResponse.Location;
  } catch (error) {
    console.error("Lỗi upload lên S3:", error);
    throw error;
  }
};
