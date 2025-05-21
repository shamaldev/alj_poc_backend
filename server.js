const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const upload = multer({ dest: "uploads/" });

const swaggerDocument = YAML.load("./swagger.yaml");

app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     const fileStream = fs.createReadStream(filePath);
//     const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
//     const response = await axios.put(
//       "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/user_input/user_input7.mp3?overwrite=true",
//       fileStream,
//       {
//         headers: {
//           Authorization: `Bearer ${TOKEN}`,
//           "Content-Disposition": `attachment; filename=${req.file.originalname}`,
//           "Content-Type": "audio/mpeg",
//         },
//         maxBodyLength: Infinity,
//         maxContentLength: Infinity,
//       }
//     );

//     fs.unlinkSync(filePath); // Clean up uploaded file
//     res.status(200).send("File uploaded to Databricks.");
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).send("Upload failed.");
//   }
// });

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const filePath = req.file.path;
      const fileStream = fs.createReadStream(filePath);
  
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // e.g., 2025-05-21T15-22-30-123Z
      const newFileName = `user_input_${timestamp}.mp3`;
  
      const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
      const uploadUrl = `https://adb-3942989410469201.1.azuredatabricks.net/api/2.0/fs/files/Volumes/datalink/lineagedemo/user_input/${newFileName}?overwrite=true`;
  
      const response = await axios.put(
        uploadUrl,
        fileStream,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Disposition": `attachment; filename=${newFileName}`,
            "Content-Type": "audio/mpeg",
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
  
      fs.unlinkSync(filePath); // Clean up uploaded file
      res.status(200).send(`File uploaded as ${newFileName}`);
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).send("Upload failed.");
    }
  });
  

app.head("/file-metadata", async (req, res) => {
  // const { file_path } = req.query;

  // if (!file_path) {
  //   return res.status(400).send('Missing file_path query parameter.');
  // }

  PATH =
    "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/output_audio/output.mp3";
  const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
  try {
    const response = await axios.head(`${PATH}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    // Forward the metadata headers to the client
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status).end();
  } catch (error) {
    console.error(error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .send(error.response?.statusText || "Failed to fetch metadata.");
  }
});

app.get("/audio-binary", async (req, res) => {
  const AUDIO_URL =
    "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/ouput_audio/output.mp3";
  const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";

  try {
    const response = await axios.get(AUDIO_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      responseType: "arraybuffer",
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(response.data, "binary"));
  } catch (err) {
    console.error(err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .send(err.response?.statusText || "Failed to load audio binary.");
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
  console.log("Swagger UI: http://localhost:3001/api-docs");
});
