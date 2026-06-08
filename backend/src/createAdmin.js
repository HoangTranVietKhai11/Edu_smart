const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@edusmart.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.role = 'admin';
      await admin.save();
      console.log('Updated existing user to admin');
    } else {
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'password123', // Will be hashed by pre-save hook
        role: 'admin',
        isActive: true,
        isFirstLogin: false
      });
      console.log('Created new admin user. Email: admin@edusmart.com, Password: password123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
