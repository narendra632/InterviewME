const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse-new');
const fs = require('fs');
const cors = require('cors');
const { User } = require('./db');
const path = require('path');
require('dotenv').config();
const hf = require("@huggingface/inference");




const app = express();
const upload = multer({ dest: 'uploads/' }); 

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

            // Ensure the 'backend2' directory exists
            fs.mkdirSync(outputDir, { recursive: true });

            // Define the path for the .txt file in the backend2 directory
            const txtFilePath = path.join(outputDir, 'resume.txt');
            
            // Append the extracted text to the .txt file in backend2
            fs.writeFileSync(txtFilePath, text, 'utf-8');

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


app.get('/interview-questions', async (req, res) => {
    const client = new hf.HfInference(process.env.HFK);
    const data = await User.find({ questionaries }).sort({ _id: -1 }).limit(1);
    const q = data[0];  // Sending the last item from the array
    
    try {
      const chatCompletion = await client.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "user",
            content: `I'll give you set of object contain quetion and answers so u have to create set of stats like result from the answers that is for quetions give me output in following fromat
            Accuracy : 0.0 out of 100
            Listning skills : 0.0 out of 10
            Overall score 0.0 out of 10

            data = ${q}
            `
          }
        ],
        max_tokens: 1500
      });
  
      res.json({ questions: chatCompletion.choices[0].message.content });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching interview questions");
    }
  });





// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
