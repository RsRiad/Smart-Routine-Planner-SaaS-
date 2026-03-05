const testAuth = async () => {
  const apiUrl = "http://localhost:5000/api/auth";

  // Random email for testing
  const email = `testuser${Date.now()}@example.com`;
  const password = "Password123!";

  try {
    console.log(`\n--- Testing Registration for ${email} ---`);
    const regRes = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Test User" }),
    });

    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log("Response:", regData);

    if (regRes.status !== 201) {
      throw new Error("Registration failed");
    }

    console.log(`\n--- Testing Login for ${email} ---`);
    const loginRes = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log("Response:", loginData);

    if (loginRes.status !== 200) {
      throw new Error("Login failed");
    }

    console.log("\n✅ All auth tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

testAuth();
