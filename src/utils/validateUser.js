import validator from "validator";

function validateUser(data){
    const mandatoryFields = ["firstName", "email", "password"];
    const isPresent = mandatoryFields.every((field) => Object.keys(data).includes(field));

    if(!isPresent){
        throw new Error("Some fields are missing!");
    }

    if(!validator.isEmail(data.email)){
        throw new Error("Invalid Email");
    }

    if(!validator.isStrongPassword(data.password)){
        throw new Error("Weak Password");
    }

    if(!(data.firstName.length>=3 && data.firstName.length<=20)){
        throw new Error("First Name should have at least 3 chars and atmost 20 chars");
    }
}

export default validateUser;

