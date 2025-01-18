const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse-new');
const fs = require('fs');
const cors = require('cors');
const app = express();


app.use(cors());
// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be uploaded to the 'uploads' directory



app.get('/login',(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const user = Users.find(user => user.email === email && user.password === password);
    if (!user) {
        res.status(500).json({
            msg:"wrong inputs"
        })
    }
})

app.post('/upload', upload.single('pdf'), (req, res) => {
    // Get the uploaded file
    const filePath = req.file.path;

    // Read the file and parse the PDF
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer)
        .then((data) => {
            res.send(data.text);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete file:', err);
                }
            });
        })
        .catch((err) => {
            res.status(500).send('Error parsing PDF: ' + err.message);
        });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
