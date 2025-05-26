// const express = require("express");
// const multer = require("multer");
// const axios = require("axios");
// const cors = require("cors");
// const fs = require("fs");
// const swaggerUi = require("swagger-ui-express");
// const YAML = require("yamljs");

// const app = express();
// const upload = multer({ dest: "uploads/" });

// const swaggerDocument = YAML.load("./swagger.yaml");

// app.use(cors());
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// // app.post("/upload", upload.single("file"), async (req, res) => {
// //   try {
// //     const filePath = req.file.path;
// //     const fileStream = fs.createReadStream(filePath);
// //     const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
// //     const response = await axios.put(
// //       "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/user_input/user_input7.mp3?overwrite=true",
// //       fileStream,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${TOKEN}`,
// //           "Content-Disposition": `attachment; filename=${req.file.originalname}`,
// //           "Content-Type": "audio/mpeg",
// //         },
// //         maxBodyLength: Infinity,
// //         maxContentLength: Infinity,
// //       }
// //     );

// //     fs.unlinkSync(filePath); // Clean up uploaded file
// //     res.status(200).send("File uploaded to Databricks.");
// //   } catch (err) {
// //     console.error(err.response?.data || err.message);
// //     res.status(500).send("Upload failed.");
// //   }
// // });

// app.post("/upload", upload.single("file"), async (req, res) => {
//     try {
//       const filePath = req.file.path;
//       const fileStream = fs.createReadStream(filePath);
  
//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // e.g., 2025-05-21T15-22-30-123Z
//       const newFileName = `user_input_${timestamp}.mp3`;
  
//       const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
//       const uploadUrl = `https://adb-3942989410469201.1.azuredatabricks.net/api/2.0/fs/files/Volumes/datalink/lineagedemo/user_input/${newFileName}?overwrite=true`;
  
//       const response = await axios.put(
//         uploadUrl,
//         fileStream,
//         {
//           headers: {
//             Authorization: `Bearer ${TOKEN}`,
//             "Content-Disposition": `attachment; filename=${newFileName}`,
//             "Content-Type": "audio/mpeg",
//           },
//           maxBodyLength: Infinity,
//           maxContentLength: Infinity,
//         }
//       );
  
//       fs.unlinkSync(filePath); // Clean up uploaded file
//       res.status(200).send(`File uploaded as ${newFileName}`);
//     } catch (err) {
//       console.error(err.response?.data || err.message);
//       res.status(500).send("Upload failed.");
//     }
//   });
  

// app.head("/file-metadata", async (req, res) => {
//   // const { file_path } = req.query;

//   // if (!file_path) {
//   //   return res.status(400).send('Missing file_path query parameter.');
//   // }

//   PATH =
//     "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/output_audio/output.mp3";
//   const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";
//   try {
//     const response = await axios.head(`${PATH}`, {
//       headers: {
//         Authorization: `Bearer ${TOKEN}`,
//       },
//     });

//     // Forward the metadata headers to the client
//     Object.entries(response.headers).forEach(([key, value]) => {
//       res.setHeader(key, value);
//     });

//     res.status(response.status).end();
//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res
//       .status(error.response?.status || 500)
//       .send(error.response?.statusText || "Failed to fetch metadata.");
//   }
// });

// app.get("/audio-binary", async (req, res) => {
//   const AUDIO_URL =
//     "https://adb-3942989410469201.1.azuredatabricks.net//api/2.0/fs/files/Volumes/datalink/lineagedemo/ouput_audio/output.mp3";
//   const TOKEN = "dapi920f192e4012fa389f31d19a3350dab1-3";

//   try {
//     const response = await axios.get(AUDIO_URL, {
//       headers: {
//         Authorization: `Bearer ${TOKEN}`,
//       },
//       responseType: "arraybuffer",
//     });

//     res.setHeader("Content-Type", "audio/mpeg");
//     res.send(Buffer.from(response.data, "binary"));
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res
//       .status(err.response?.status || 500)
//       .send(err.response?.statusText || "Failed to load audio binary.");
//   }
// });

// app.listen(3001, () => {
//   console.log("Server running on http://localhost:3001");
//   console.log("Swagger UI: http://localhost:3001/api-docs");
// });
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });
const swaggerDocument = YAML.load("./swagger.yaml");

app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const TOKEN = process.env.TOKEN;
const BASE_URL = "https://adb-3100149734145223.3.azuredatabricks.net";
const POLL_INTERVAL = 120000; // 2 minutes (120000 ms) - for backend's internal job status checks

let currentRunId = null;
let pollingInterval = null;
let isProcessing = false; // Flag to indicate if a job is currently being processed by the backend

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const newFileName = `user_input_${timestamp}.mp3`;

    const uploadUrl = `${BASE_URL}/api/2.0/fs/files/Volumes/datalink/lineagedemo/input_audio/${newFileName}?overwrite=true`;

    await axios.put(uploadUrl, fileStream, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Disposition": `attachment; filename=${newFileName}`,
        "Content-Type": "audio/mpeg",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    fs.unlinkSync(filePath);
    res.status(200).send(`File uploaded as ${newFileName}`);

    const uploadTimestamp = Date.now();
    startPollingAfterUpload(uploadTimestamp);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Upload failed.");
  }
});

app.head("/file-metadata", async (req, res) => {
  const PATH = `${BASE_URL}/api/2.0/fs/files/Volumes/datalink/lineagedemo/output_audio/output.mp3`;

  try {
    const response = await axios.head(PATH, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

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
  const AUDIO_URL = `${BASE_URL}/api/2.0/fs/files/Volumes/datalink/lineagedemo/output_audio/output.mp3`;

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

// NEW ENDPOINT: To be polled by the frontend for AI audio status
app.get("/ai-audio-status", async (req, res) => {
  try {
    // If the backend's internal polling is active, it means a job is being processed
    if (isProcessing) {
      return res.status(200).json({ isProcessing: true, isReady: false });
    }

    // If no job is actively being processed by the backend's poller, check if the output file exists
    const OUTPUT_AUDIO_PATH = `${BASE_URL}/api/2.0/fs/files/Volumes/datalink/lineagedemo/output_audio/output.mp3`;
    try {
      // Attempt a HEAD request to check for file existence without downloading
      await axios.head(OUTPUT_AUDIO_PATH, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });
      // If HEAD request succeeds, the file exists and is presumed ready
      return res.status(200).json({ isProcessing: false, isReady: true });
    } catch (headError) {
      if (headError.response && headError.response.status === 404) {
        // File not found, meaning the job probably hasn't completed or failed to produce it yet
        return res.status(200).json({ isProcessing: false, isReady: false });
      }
      // Other error during HEAD request (e.g., authentication, network)
      console.error("Error checking output file existence:", headError.response?.data || headError.message);
      return res.status(500).json({ error: "Failed to check output file status." });
    }
  } catch (error) {
    console.error("Error in /ai-audio-status:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.delete("/file", async (req, res) => {
  try {
    // const filePath = req.file.path;
    // const fileStream = fs.createReadStream(filePath);
    // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // const newFileName = `user_input_${timestamp}.mp3`;

    const deleteUrl = `${BASE_URL}/api/2.0/fs/files/Volumes/datalink/lineagedemo/history/history.json`;

    await axios.delete(deleteUrl,  {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    res.status(200).send(`File sucessfully deleted`);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("delete failed.");
  }
});


// Utility: Get the latest run from workflow
async function findRecentRun(uploadTimestamp) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/2.1/jobs/runs/list?limit=10`, // Limit to recent runs
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    const runs = response.data.runs || [];
    // Filter runs that started after the upload and are not already completed/failed
    for (const run of runs) {
      const startTime = run.start_time || 0;
      // Check if run started after upload and is still active (or very recently terminated)
      if (
        startTime >= uploadTimestamp &&
        !["TERMINATED", "SKIPPED", "INTERNAL_ERROR"].includes(run.state.life_cycle_state)
      ) {
        return run.run_id;
      }
    }
  } catch (err) {
    console.error("Error fetching runs:", err.response?.data || err.message);
  }

  return null;
}

// Polling logic for a specific run (backend's internal check)
async function pollRunStatus(runId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/2.1/jobs/runs/get?run_id=${runId}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    const lifeCycleState = response.data.state.life_cycle_state;
    const resultState = response.data.state.result_state;

    console.log(`Polling: ${lifeCycleState} (${resultState || "N/A"})`);

    if (["TERMINATED", "SKIPPED", "INTERNAL_ERROR"].includes(lifeCycleState)) {
      clearInterval(pollingInterval); // Stop polling when job is done
      isProcessing = false; // Mark as not processing
      currentRunId = null; // Clear run ID
      console.log(`Job finished with state: ${resultState}`);
    }
  } catch (err) {
    console.error("Polling error:", err.response?.data || err.message);
    // In case of error, stop polling to prevent excessive requests
    clearInterval(pollingInterval);
    isProcessing = false;
    currentRunId = null;
  }
}

// Start backend polling with delay after upload
async function startPollingAfterUpload(uploadTimestamp) {
  // Clear any existing polling interval to avoid conflicts
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  isProcessing = true; // Mark as processing
  console.log("Waiting 1 minute before checking Databricks job status...");

  setTimeout(async () => {
    currentRunId = await findRecentRun(uploadTimestamp);
    if (!currentRunId) {
      console.log("No recent job run found after 1 minute. Will not poll internally.");
      isProcessing = false; // No job found, so not processing
      return;
    }

    console.log(`Started internal polling for job run: ${currentRunId}`);

    // Initial poll immediately after finding the run
    await pollRunStatus(currentRunId);

    // Continue polling at the defined POLL_INTERVAL
    pollingInterval = setInterval(() => {
      pollRunStatus(currentRunId);
    }, POLL_INTERVAL);
  }, 60000); // Wait 1 minute (60000 ms) before looking for the job and starting internal polling
}

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
  console.log("Swagger UI: http://localhost:3001/api-docs");
});