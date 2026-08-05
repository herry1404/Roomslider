const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({
  path: "./.env",
});

const User = require("../models/user.model");


const createAdmin = async () => {

  try {

    await mongoose.connect(
      process.env.MONGODB_URI
    );


    console.log("MongoDB Connected ✅");



    const existingAdmin = await User.findOne({
      email: "superadmin@roomslider.com",
    });



    if(existingAdmin){

      console.log(
        "Super Admin already exists ✅"
      );

      process.exit();

    }




    const hashedPassword =
      await bcrypt.hash(
        "H@riom9131",
        10
      );





    const admin = await User.create({

      name:"Super Admin",

      email:"superadmin@roomslider.com",

      phone:"9999999999",

      password:hashedPassword,

      role:"admin",

    });




    console.log(
      "🎉 Super Admin Created Successfully"
    );


    console.log(admin.email);



    process.exit();



  } catch(error){


    console.log(
      "Admin Creation Error ❌",
      error
    );


    process.exit(1);

  }

};



createAdmin();