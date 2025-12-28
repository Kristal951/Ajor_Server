import { auth, db } from "../lib/FirebaseAdmin.js";
import admin from "firebase-admin";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email } = decodedToken;

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    const userData = {
      uid,
      name,
      email,
      balance: 0,
      hasPin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData);

    res.status(201).json({
      user: { uid, name, email, balance: 0 },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

export const createUserAppPin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be a 4-digit number" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userDoc.data().hasPin) {
      return res.status(409).json({ error: "PIN already set" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    await userRef.update({
      pinHash: hashedPin,
      hasPin: true,
      pinCreatedAt: new Date().toISOString(),
    });

    res.status(201).json({ message: "PIN created successfully" });
  } catch (error) {
    console.error("Create PIN error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

export const verifyUserPin = async (req, res) => {
  console.log(req.body);
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be a 4-digit number" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!userData.hasPin || !userData.pinHash) {
      return res.status(409).json({ error: "PIN not set" });
    }

    const isMatch = await bcrypt.compare(pin, userData.pinHash);
    if (!isMatch) {
      return res.status(401).json({ error: "InCorrect PIN" });
    }

    res.status(200).json({ message: "PIN verified successfully" });
  } catch (error) {
    console.error("Verify PIN error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

export const getCurrentUser = async (req, res) => {
  console.log(req.body);
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnap.data();
    console.log(userData);
    res.status(200).json({
      user: {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        balance: userData.balance,
        hasPin: userData.hasPin,
        emailVerified: decodedToken.email_verified,
        createdAt: userData.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
