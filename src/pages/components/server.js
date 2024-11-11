// you can use this to call the api.py

const { exec } = require("child_process");

const input_message = "When is washington conference?";

exec(`python3 api.py "${input_message}"`, (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
  } else if (stderr) {
    console.log(`stderr: ${stderr}`);
  } else {
    // Parse the stdout as JSON
    try {
      const responseData = JSON.parse(stdout); // Parsing the JSON response
      console.log("Parsed Output:", responseData);

      // Now you can access each component
      const message = responseData.message;
      const warning = responseData.warning;
      const context = responseData.context;

      console.log(`Message: ${message}`);
      console.log(`Warning: ${warning}`);
      console.log(`Context: ${context}`);
    } catch (parseError) {
      console.log("Error parsing JSON:", parseError);
    }
  }
});
