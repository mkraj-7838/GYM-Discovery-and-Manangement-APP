// models/Maintenance.js
import mongoose from "mongoose";


const MaintenanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  cost: {
    type: Number,
    default: 0
  },
  description: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });


const Maintenance=mongoose.model('Maintenance', MaintenanceSchema);
export default Maintenance;
