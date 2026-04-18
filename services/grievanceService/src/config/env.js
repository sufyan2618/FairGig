import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3002),
  MONGO_URI: Joi.string().uri({ scheme: ["mongodb", "mongodb+srv"] }).required(),
  JWT_SECRET: Joi.string().min(16).required(),
  CORS_ORIGINS: Joi.string().default("http://localhost:5173,http://localhost:8080"),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });
if (error) {
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

export const env = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  mongoUri: value.MONGO_URI,
  jwtSecret: value.JWT_SECRET,
  corsOrigins: value.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean),
};
