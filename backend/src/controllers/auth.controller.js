const User = require("../models/user.model");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ======================
// CREATE JWT TOKEN
// ======================

const createToken = (user) => {

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

};




// ======================
// REGISTER USER
// ======================

const register = async (req, res) => {

  try {


    const validatedData =
      registerSchema.parse(req.body);



    const existingUser =
      await User.findOne({
        email: validatedData.email,
      });



    if(existingUser){

      return res.status(409).json({

        success:false,

        message:"Email already registered",

      });

    }




    const hashedPassword =
      await bcrypt.hash(
        validatedData.password,
        10
      );





    const user = await User.create({

      name: validatedData.name,

      email: validatedData.email,

      phone: validatedData.phone,

      password: hashedPassword,

      role:"user",

    });





    if(!process.env.JWT_SECRET){

      throw new Error(
        "JWT_SECRET missing in .env"
      );

    }





    const token =
      createToken(user);





    return res.status(201).json({

      success:true,

      message:
      "User registered successfully",


      token,


      user:{

        id:user._id,

        name:user.name,

        email:user.email,

        phone:user.phone,

        role:user.role,

      },

    });




  } catch(error){


    console.error(
      "REGISTER ERROR 👉",
      error
    );



    if(error.name==="ZodError"){


      return res.status(400).json({

        success:false,

        message:
        error.issues[0]?.message ||
        "Invalid input",

        errors:error.issues,

      });

    }




    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};









// ======================
// LOGIN USER
// ======================

const login = async (req,res)=>{


  try{


    const validatedData =
      loginSchema.parse(req.body);




    const user =
      await User.findOne({
        email:validatedData.email,
      });





    if(!user){


      return res.status(404).json({

        success:false,

        message:"User not found",

      });


    }





    const isPasswordMatch =
      await bcrypt.compare(

        validatedData.password,

        user.password

      );





    if(!isPasswordMatch){


      return res.status(401).json({

        success:false,

        message:"Invalid password",

      });


    }





    if(!process.env.JWT_SECRET){

      throw new Error(
        "JWT_SECRET missing in .env"
      );

    }





    const token =
      createToken(user);







    return res.status(200).json({

      success:true,

      message:
      "Login successful",


      token,



      user:{

        id:user._id,

        name:user.name,

        email:user.email,

        phone:user.phone,

        role:user.role,

      },


    });





  }catch(error){


    console.error(
      "LOGIN ERROR 👉",
      error
    );





    if(error.name==="ZodError"){


      return res.status(400).json({

        success:false,

        message:
        error.issues[0]?.message ||
        "Invalid input",

        errors:error.issues,

      });

    }






    return res.status(500).json({

      success:false,

      message:error.message,

    });



  }


};







module.exports = {

  register,

  login,

};