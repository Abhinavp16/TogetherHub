const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/togetherhub')
    .then(async () => {
        try {
            const email = 'Abhinav16';
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                const user = new User({
                    name: 'Demo User',
                    email: 'Abhinav16',
                    password: '123456'
                });
                await user.save();
                console.log('Successfully seeded demo user!');
            } else {
                console.log('Demo user already exists.');
            }
        } catch (e) {
            console.log('Error seeding:', e.message);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
