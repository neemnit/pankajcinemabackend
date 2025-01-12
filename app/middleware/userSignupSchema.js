const yup = require('yup');
const UserSignup = require('../models/UserSignup'); // Assuming you have this model for your user data

// Define Yup validation schema
const userSignupSchema = yup.object().shape({
    name: yup
        .string()
        .required('Please fill your name correctly')
        .min(3, 'Name should be more than 2 characters')
        .max(17, 'Name should not be more than 17 characters')
        .matches(/^(?!.*([a-zA-Z])\1{2})[a-zA-Z]+$/, 'Please enter a valid name'),

    email: yup
        .string()
        .required('Please enter your email')
        .email('Please enter a valid email address')
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address')
        .test('unique-email','email already exists',async function (value) {
            const existingUser = await UserSignup.findOne({ email: value });
            return !existingUser; // If exists, return false (invalid); if not, return true (valid)
        })
,
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters long')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/\d/, 'Password must contain at least one number')
        .matches(/[\W_]/, 'Password must contain at least one symbol'),

    adharNo: yup
        .string()
        .required('Please enter your Aadhaar number')
        .matches(/^\d{16}$/, 'Aadhaar number must be exactly 16 digits')
        .test('unique-adhar', 'Aadhaar number already exists', async function (value) {
            const existingUser = await UserSignup.findOne({ adharNo: value });
            return !existingUser; // If exists, return false (invalid); if not, return true (valid)
        }),

    role: yup
        .string()
        .default('user')
});

module.exports = userSignupSchema;
