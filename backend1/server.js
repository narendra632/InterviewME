const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse-new');
const fs = require('fs');
const cors = require('cors');
const { User, Jobs } = require('./db');
const path = require('path');


const app = express();
const upload = multer({ dest: 'uploads/' }); 

//const rdata = "";

app.use(express.json())

app.use(cors());

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = User.find(user => user.email === email && user.password === password);
    if (!user) {
        res.status(500).json({ msg: "wrong inputs" });
    }
});



app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        await User.create({ name, email, password });
        res.status(201).json({ msg: "User created successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Error creating user", error: err.message });
    }
});



const outputDir = path.join(__dirname, '..', 'backend2'); // Path to backend2 directory

app.post('/upload', upload.single('pdf'), (req, res) => {
    // Ensure filePath is defined
    const filePath = req.file ? req.file.path : null; // Safely assign filePath
    const email = req.body.email;

    if (!filePath) {
        return res.status(400).send('No file uploaded.');
    }

    // Read the file and parse the PDF
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer)
        .then((data) => {
            const text = data.text;
           // rdata = text;
            // Ensure the 'backend2' directory exists
            fs.mkdirSync(outputDir, { recursive: true });

            // Define the path for the .txt file in the backend2 directory
            const txtFilePath = path.join(outputDir, 'system_prompt.txt');
            
            // Append the extracted text to the .txt file in backend2
            fs.appendFile(txtFilePath, text + '\n', (err) => {
                if (err) {
                    console.error('Error appending text to file:', err);
                } else {
                    console.log('Text appended to file in backend2 successfully.');
                }
            });

            // Send the extracted text as a response
            res.send(text);

            // Update user record with extracted text
            User.updateOne({ email: email }, { extractedText: text })
                .then(() => {
                    console.log("Updated user with extracted text.");
                });

            // Delete the uploaded file after processing
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete file:', err);
                }
            });
        })
        .catch((err) => {
            console.error('Error during PDF parsing:', err);
            res.status(500).send('Error parsing PDF: ' + err.message);
        });
});










app.get('/jobs',async (req,res)=>{
    const data = await Jobs.find({})
    res.json(data);
})




app.post('/compatibility', async (req, res) => {
  const hf = require('@huggingface/inference');
  const client = new hf.HfInference('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');

  try {
    // Use lean() for faster MongoDB queries
    const jd = await Jobs.findOne({ id: req.body.id }).lean();

    if (!jd) {
      return res.status(404).json({ error: "Job description not found" });
    }

    const rdata = req.body.rdata; // Assuming resume data is provided

    // Call Hugging Face API
    const chatCompletion = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        {
          role: "user",
          content: `You are an AI designed to evaluate the compatibility between job descriptions and resumes.  

Job Description:
${jd}
Resume Data:
${rdata.toString()}

Output:
Provide a cataory among best,good,average,poor copararing the job description no explanaition only catogoary in one word!!! be tough if youn want, dont see the size of data be tough on all
`
        }
      ],
      max_tokens: 30, // Keep this low to reduce processing time
      temperature: 0.8 // Low temperature for deterministic output
    });

    // Parse and validate the response
    const rawResponse = chatCompletion.choices[0];
    const score = parseFloat(rawResponse);

    

    res.json({ rawResponse });
  } catch (error) {
    console.error("Error:", error.message || error);
    res.status(500).json({ error: "Failed to calculate compatibility score" });
  }
});




app.post('/stats', async (req, res) => {
  const hf = require('@huggingface/inference');
  const client = new hf.HfInference('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');

  const ans = req.body.ans;
  const que = req.body.que;

  try {
    const chatCompletion = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        {
          role: "user",
          content: `You are an AI interviewer evaluating a candidate's answer based on a passage of answer and a set of questions.

          The answer provided is:
          ${ans}

          The questions provided are:
          ${que}

          Please evaluate the following based on the answer and questions, and provide a response in the exact format below (do not add anything else):

          {
            "Accuracy": 0.0,  // Accuracy score of the answer out of 100
            "Listening Skills": 0.0,  // Listening skills score out of 10
            "Overall Score": 0.0  // Overall score out of 10
          }

          (No other suggetion/feedback just object format)`
        }
      ],
      max_tokens: 150
    });

    // Log the full response to see what is returned
    console.log("Chat Completion Response:", chatCompletion.choices[0].message.content);

    // Assuming the response is in a 'generated_text' field, adjust if needed
    const result = chatCompletion?.generated_text || chatCompletion;

    // If the response contains structured data, process it accordingly
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching interview questions");
  }
});




// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
