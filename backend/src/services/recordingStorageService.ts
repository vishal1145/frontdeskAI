import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class RecordingStorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private localRecordingsDir: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || "frontdesk-ai-call-recordings";
    this.region = process.env.AWS_REGION || "ap-south-1";
    this.localRecordingsDir = path.join(process.cwd(), "recordings");

    // Ensure local recordings directory exists for local fallback
    if (!fs.existsSync(this.localRecordingsDir)) {
      fs.mkdirSync(this.localRecordingsDir, { recursive: true });
    }

    if (this.isAwsConfigured()) {
      try {
        this.s3Client = new S3Client({
          region: this.region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
          }
        });
      } catch (e: any) {
        console.warn(`[S3 CLIENT INIT WARNING] ${e.message}`);
      }
    }
  }

  /**
   * Checks if real AWS credentials are provided (not placeholder/dummy).
   */
  public isAwsConfigured(): boolean {
    const key = process.env.AWS_ACCESS_KEY_ID || "";
    const secret = process.env.AWS_SECRET_ACCESS_KEY || "";
    return (
      Boolean(key && secret) &&
      !key.includes("EXAMPLE") &&
      !key.startsWith("your_") &&
      !secret.includes("EXAMPLE") &&
      !secret.startsWith("your_")
    );
  }

  /**
   * Computes the S3 object key or relative path for a call recording.
   */
  public getRecordingKey(clinicId: string, callSid: string): string {
    const safeSid = callSid.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `recordings/${clinicId}/${safeSid}.mp3`;
  }

  /**
   * Returns the canonical recording URL or local fallback URL for the database.
   */
  public getRecordingUrl(clinicId: string, callSid: string): string {
    const key = this.getRecordingKey(clinicId, callSid);
    if (this.isAwsConfigured()) {
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
    // Local / internal streaming path
    return `/api/recordings/${clinicId}/${callSid}.mp3`;
  }

  /**
   * Generates a secure Presigned URL for playing audio directly in the browser dashboard.
   * If S3 is not configured or file is local, returns the direct local audio endpoint.
   */
  public async getPlaybackUrl(clinicId: string, callSid: string, rawUrl?: string | null): Promise<string> {
    const key = this.getRecordingKey(clinicId, callSid);

    if (this.isAwsConfigured() && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
        // Presigned URL valid for 2 hours for secure in-browser playback
        const presigned = await getSignedUrl(this.s3Client, command, { expiresIn: 7200 });
        return presigned;
      } catch (err: any) {
        console.warn(`[S3 PRESIGNED ERROR] Failed to sign URL for ${key}:`, err.message);
      }
    }

    // Check if a local file exists
    const localFilePath = path.join(this.localRecordingsDir, clinicId, `${callSid.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp3`);
    if (fs.existsSync(localFilePath)) {
      return `/api/recordings/${clinicId}/${callSid}.mp3`;
    }

    // If an external URL is already present in database (e.g. from Vobiz or LiveKit)
    if (rawUrl && rawUrl.startsWith("http")) {
      return rawUrl;
    }

    // Return the fallback streaming endpoint
    return `/api/recordings/${clinicId}/${callSid}.mp3`;
  }

  /**
   * Saves a recording file to local storage or uploads to S3
   */
  public async saveAudioBuffer(clinicId: string, callSid: string, buffer: Buffer): Promise<string> {
    const key = this.getRecordingKey(clinicId, callSid);

    if (this.isAwsConfigured() && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: "audio/mpeg"
          })
        );
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      } catch (err: any) {
        console.error(`[S3 UPLOAD ERROR] ${err.message}`);
      }
    }

    // Local fallback
    const clinicDir = path.join(this.localRecordingsDir, clinicId);
    if (!fs.existsSync(clinicDir)) {
      fs.mkdirSync(clinicDir, { recursive: true });
    }
    const safeSid = callSid.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(clinicDir, `${safeSid}.mp3`);
    fs.writeFileSync(filePath, buffer);

    return `/api/recordings/${clinicId}/${callSid}.mp3`;
  }
}

export const recordingStorageService = new RecordingStorageService();
