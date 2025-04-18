const mongoose = require('mongoose');
const env = require('dotenv');


mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  extractedText: { type: String },
  questionaries: { type: Object },  
  stats: { type: Object }
});


const jobDSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  role: { type: String, required: true },
  deadline: { type: String },
  experience: { type: Number },  
  requirements: { type: String },
  description: {type:String}
});


const User = mongoose.model('Users', userSchema);
const Jobs = mongoose.model('Jobs', jobDSchema);





module.exports = { User,Jobs };