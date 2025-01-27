import mongoose from 'mongoose';

const idProofSchema = new mongoose.Schema({
    consultantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consultant_Profile",
        required: true,
    },
    nationalId: {
        type: String,
        required: true,
        unique: true,
    },
    frontsideId: {
        type: String, 
        required: true,
    },
    backsideId: {
        type: String, 
        required: true,
    },
    educationalCertificates: {
        type: [String], 
        required: true,
    },
    experienceCertificates: {
        type: [String], 
        required: true,
    },
    documentStatus: {
        frontsideId: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        backsideId: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        educationalCertificates: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        experienceCertificates: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending', 
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
});

const IDProof = mongoose.model("Consultant_IDProof", idProofSchema);
export default IDProof;
