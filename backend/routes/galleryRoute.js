import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import Gallery from "../models/galleryModel.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

dotenv.config();
const router = express.Router();

const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsBucketName = process.env.AWS_BUCKET_NAME;
const awsBucketRegion = process.env.AWS_BUCKET_REGION;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretAccessKey,
  },
  region: awsBucketRegion,
});

// Memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Compress and save function for both image and video
const compressAndSaveFile = async (file) => {
  try {
    const randomNumber = Math.floor(Math.random() * 1000000) + 1000000;
    let compressedFileName;
    let compressedFile;

    if (file.mimetype.startsWith("video")) {
      // Handle video compression if needed
      // For now, we're just returning the original video file without compression
      compressedFileName = `${
        file.originalname.split(".")[0]
      }${randomNumber}.mp4`;
      compressedFile = file.buffer;
    } else {
      compressedFileName = `${
        file.originalname.split(".")[0]
      }${randomNumber}.jpg`;
      compressedFile = await sharp(file.buffer)
        .jpeg({ quality: 30 })
        .toBuffer();
    }

    return {
      fileName: compressedFileName,
      buffer: compressedFile,
    };
  } catch (error) {
    throw new Error("Error compressing file");
  }
};

// POST route to add a new gallery item
router.post(
  "/:monumentId",
  upload.single("image"),
  async (request, response) => {
    try {
      if (!request.body.imgTitle || !request.file) {
        return response.status(400).send({
          message: "Send all required fields: imgTitle, image",
        });
      }
      const { fileName, buffer } = await compressAndSaveFile(request.file);

      const params = {
        Bucket: awsBucketName,
        Key: fileName,
        Body: buffer,
        ContentType: request.file.mimetype,
      };

      const command = new PutObjectCommand(params);

      await s3.send(command);

      const newGalleryItem = {
        monumentId: request.params.monumentId,
        imgTitle: request.body.imgTitle,
        image: fileName,
      };

      const galleryItem = await Gallery.create(newGalleryItem);

      return response.status(201).json(galleryItem);
    } catch (error) {
      console.error(error.message);
      return response.status(500).send({ message: "Internal Server Error" });
    }
  }
);

router.get("/monument/:monumentId", async (request, response) => {
  try {
    const galleryItems = await Gallery.find({
      monumentId: request.params.monumentId,
    });

    const updatedGalleryItems = [];
    for (const galleryItem of galleryItems) {
      const getObjectParams = {
        Bucket: awsBucketName,
        Key: galleryItem.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const updatedGalleryItem = {
        ...galleryItem.toObject(),
        imageUrl: url,
      };
      updatedGalleryItems.push(updatedGalleryItem);
    }
    return response.status(200).json(updatedGalleryItems);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

// GET route to retrieve a specific gallery item by ID
router.get("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findById(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }

    const getObjectParams = {
      Bucket: awsBucketName,
      Key: galleryItem.image,
    };

    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const updatedGalleryItem = {
      ...galleryItem.toObject(),
      imageUrl: url,
    };

    return response.status(200).json(updatedGalleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

router.put("/:id", upload.single("image"), async (request, response) => {
  try {
    let galleryItem = await Gallery.findById(request.params.id);

    if (!galleryItem) {
      return response.status(404).json({ message: "Gallery item not found" });
    }

    let oldImageKey = galleryItem.image;

    if (request.file) {
      const { fileName, buffer } = await compressAndSaveFile(request.file);

      const params = {
        Bucket: awsBucketName,
        Key: fileName,
        Body: buffer,
        ContentType: request.file.mimetype,
      };

      const command = new PutObjectCommand(params);

      await s3.send(command);

      galleryItem.image = fileName;

      const deleteOldParams = {
        Bucket: awsBucketName,
        Key: oldImageKey,
      };

      const deleteOldCommand = new DeleteObjectCommand(deleteOldParams);
      await s3.send(deleteOldCommand);
    }

    if (request.body.imgTitle) {
      galleryItem.imgTitle = request.body.imgTitle;
    }

    await galleryItem.save();

    return response.status(200).json(galleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findByIdAndDelete(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }

    const deleteParams = {
      Bucket: awsBucketName,
      Key: galleryItem.image,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    return response
      .status(200)
      .send({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

export default router;
