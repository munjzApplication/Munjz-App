import customerProfile from "../../../models/Customer/customerModels/customerModel.js"

export const getAllCustomerData = async (req, res) => {
    try {
        const customerData = await customerProfile.find({}).populate("customerProfile");
        res.status(200).json({ customerData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }

}