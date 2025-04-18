const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse-new');
const fs = require('fs');
const cors = require('cors');
const { User, Jobs } = require('./db');
const path = require('path');


const app = express();
const upload = multer({ dest: 'uploads/' }); 

const nodemailer = require("nodemailer")

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
            const txtFilePath = path.join(outputDir, 'resume.txt');
            
            // Append the extracted text to the .txt file in backend2
            fs.writeFileSync(txtFilePath, text,'utf-8', (err) => {
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


const outputDir2 = path.join(__dirname, '..', 'backend2');

// Endpoint for saving job details to jd.txt
app.post('/save-job', (req, res) => {
    const jobDetails = req.body; // Job details sent from the frontend

    if (!jobDetails) {
        return res.status(400).send('No job details provided.');
    }

    try {
        // Ensure 'backend2' directory exists
        fs.mkdirSync(outputDir2, { recursive: true });

        // Path to jd.txt file
        const jobDetailsFilePath = path.join(outputDir2, 'jd.txt');

        // Format the job details into a readable text
        const jobDetailsText = `
          Role: ${jobDetails.role}
          Experience: ${jobDetails.experience} years
          Deadline: ${jobDetails.deadline}
          Requirements: ${Array.isArray(jobDetails.requirements) ? jobDetails.requirements.join(', ') : jobDetails.requirements}
          Description: ${jobDetails.description}
        `;

        // Write the job details to jd.txt
        fs.writeFileSync(jobDetailsFilePath, jobDetailsText, 'utf-8');

        // Respond with success
        res.status(200).send('Job details saved successfully.');
    } catch (err) {
        console.error('Error saving job details:', err);
        res.status(500).send('Server error while saving job details.');
    }
});






app.get('/jobs',async (req,res)=>{
    const data = await Jobs.find({})
    res.json(data);
})




app.post('/compatibility', async (req, res) => {
  const hf = require('@huggingface/inference');
  const client = new hf.HfInference(process.env.HFK);

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
          content: `You are an AI assistant. 
Job Description: ${JSON.stringify(jd)}
Resume Data: ${JSON.stringify(rdata)}

extract the skills from the resume and compare with the job requirements skills and reply with only one word: "true" if they match, otherwise "false
in last tell me in isCompatible: true/false(only)
".`
        }
      ],
      max_tokens: 500, // Limit tokens to avoid extra data
      temperature: 0.8 // Low temperature for deterministic output
    });

    // Parse and validate the response
    const rawResponse = chatCompletion.choices[0].message.content.trim();
    function extractIsCompatibleValue(text) {
      const match = text.match(/isCompatible:\s*(true|false)/i);
      return match ? match[1] : null; // Returns 'true', 'false', or null if not found
    }
    
    const r = extractIsCompatibleValue(rawResponse)
    console.log(r);
    
    res.json({ val: r });
  } catch (error) {
    console.error("Error:", error.message || error);
    res.status(500).json({ error: "Failed to calculate compatibility score" });
  }
});



app.post('/stats', async (req, res) => {
  const hf = require('@huggingface/inference');
  const client = new hf.HfInference(process.env.HFK);

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

          the following based on the answer and questions,atleast passing marks, and provide a response in the exact json format below (do not add anything else):

          {
            "Accuracy": 40/100(default),  // Accuracy score of the answer out of 100
            "Listening Skills": 6/10(default),  // Listening skills score out of 10
            "Overall Score": 4/10(default)  // Overall score out of 10
          }

          (No other suggetion/feedback just object format)`
        }
      ],
      max_tokens: 150
    });

    // Log the full response to see what is returned
    console.log("Chat Completion Response:", chatCompletion.choices[0].message.content);

    // Assuming the response is in a 'generated_text' field, adjust if needed
    const result = chatCompletion.choices[0].message.content;

    async function sendEmail() {
      // Create a transporter using your SMTP credentials
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
          user: "mrperfectth7@gmail.com",
          pass: "kzamaqguggicaehb", 
        },
      });
    
      // Send the email
      let info = await transporter.sendMail({
        from: '"Interview ME" <mrperfectth7@gmail.com>', 
        to: "jadhavaditya080@gmail.com", 
        subject: "Feedback of the Interview from AI", 
        text: result, 
      });
      
      console.log("Message sent: %s", info.messageId);
    }

    // If the response contains structured data, process it accordingly
    sendEmail();
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