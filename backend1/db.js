const mongoose = require('mongoose');
require('dotenv').config();



mongoose.connect(process.env.MONGO_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  extractedText: { type: String },
  questionaries: { type: Object },  // corrected spelling
  stats: { type: Object }
});



const User = mongoose.model('Users', userSchema);


module.exports = { User };