const mongoose = require('mongoose');
const documentsSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    category: {
      type: String,
    },
    image: {
      type: String,
    },
    document: {
      type: String,
    },
    doesDocumentExpire: {
      type: String, 
    },
    expiryDate: {
      type: String,
    },
    note: {
        type: String,
    },
    remindMeBefore: {
        type: String,
    },
});

const costSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    category: {
      type: String,
    },
    amount: {
      type: String,
    },
    currency: {
      type: String,
    },
    date: {
      type: String,
    },
    note: {
        type: String,
    },
    reminder: {
        title: {
            type: String,
        },
        date: {
            type: String,
        },
        time: {
            type: String,
        },
        message: {
            type: String,
        },
    },
   
    document: {
        title: {
          type: String,
        },
        category: {
          type: String,
        },
        note: {
          type: String,
        },
        document: {
            type: String,
        },
        image: {
          type: String,
        },
        doesDocumentExpire: {
            type: String,
        },
        expiryDate: {
            type: String,
        },
        remindMe: {
            type: String,
        },
    },
    
});

const inventorySchema = new mongoose.Schema({
    title: {
      type: String,
    },
    category: {
      type: String,
    },
    location: {
      type: String,
    },
    quantity: {
      type: String,
    },
    minQuantity: {
      type: String,
    },
    note: {
        type: String,
    },
});
const reportSchema = new mongoose.Schema({
    time: {
      type: String,
    },
    position: {
      type: String,
    },
    speed: {
      type: String,
    },
    estimatedTime: {
      type: String,
    },
    eta: {
      type: String,
    },
    oilLeft: {
        type: String,
    },
    fuelLeft: {
        type: String,
    },
    lubricantOilLeft: {
        type: String,
    },
    anyNeed: {
        type: String,
    },
     image: {
         type: String,
     },
     document: {
         type: String,
     },
});
const maintenanceSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    date: {
      type: String,
    },
    category: {
      type: String,
    },
    location: {
      type: String,
    },
    description: {
      type: String,
    },
    cost: {
        type: String,
    },
    sparePart: {
        type: String,
    },
    image: {
      type: String,
    },
    document: {
        type: String,
    },
    reminder: {
     title: {
         type: String
        },
     date: {
         type: String,
     },
     time: {
         type: String,
     },
     message: {
         type: String,
     },
    },
     
});
const fixtureSchema = new mongoose.Schema({
    loadingPort: {
      type: String,
    },
    dischargingPort: {
      type: String,
    },
    cargo: {
      type: String,
    },
    freight: {
      type: String,
    },
    laycan: {
      type: String,
    },
    commission: {
        type: String,
    },
    reminder: {
     title: {
         type: String
        },
     date: {
         type: String,
     },
     time: {
         type: String,
     },
     message: {
         type: String,
     },
    },
     image: {
         type: String,
     },
     document: {
         type: String,
     },
});
const vesselSchema = mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    vesselName: {
      type: String,
    },
    captain: {
       type: String
    },
    captainId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    }],
    vesselType: {
      type: String,
    },
    vesselModel: {
      type: String,
    },
    yearOfManufacture: {
      type: String,
    },
    imoNo: {
      type: String,
    },
    registrationNo: {
        type: String,
      },
    registrationExpiryDate: {
    type: String,
    },
    country: {
        type: String,
    },
    vesselMMSI: {
        type: String,
    }, 
    // lengthOverall: {
    //     type: String,
    // },
    // lengthWaterline: {
    //     type: String,
    // },
    // maxBeam: {
    //     type: String,
    // },
    // draft: {
    //     type: String,
    // },
    // maxSpeed: {
    //     type: String,
    // },
    // cruisingSpeed: {
    //     type: String,
    // },
    // fuelType: {
    //     type: String,
    // },
    // range: {
    //     type: String,
    // },
    // loadedDisplacement: {
    //     type: String,
    // },
    // passengerCapacity: {
    //     type: String,
    // },
    vesselClass: {
      type: String,
    },
    deadWeight: {
      type: String,
    },
    flag: {
      type: String,
    },
    portOfRegistry: {
       type: String,
    },
    engine: {
        title: {
            type: String
        },
        serialNo: {
            type: String,
        },
        lastServiceWorkingHour: {
            type: String,
        },
      
    },
    tank: {
        title: {
            type: String,
        },
        capacity: {
            type: String,
        },
        currentCapacity: {
            type: String,
        },
        yellowCapacityWarning: {
            type: String,
        },
        redCapacityWarning: {
            type: String,
        },
    },
    document: {
        type: String,
    },
    image: {
        type: String,
    },
    documents: [documentsSchema],
    costs: [costSchema],
    inventory: [inventorySchema],
    report: [reportSchema],
    maintenance: [maintenanceSchema],
    fixtures: [fixtureSchema],
    reminders: [ {
        title: {
            type: String,
        },
        date: {
            type: String,
        },
        time: {
            type: String,
        },
        message: {
            type: String
        }
    }]
  },
  {
    timestamps: true,
  },
);

const Vessel = mongoose.model('Vessel', vesselSchema);
module.exports = Vessel;
