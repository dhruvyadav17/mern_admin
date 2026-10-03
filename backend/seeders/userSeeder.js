require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const users = [
    {
        _id: new mongoose.Types.ObjectId("6abb795984731afe922b6573"),
        name: "Admin User",
        email: "admin@example.com",
        password: "$2b$10$qxM4eYJVPyk2QLugm4Q6aewMH.xF9TDDi5ggZWO4B2ZvFKvry3Zbi",
        role: "admin",
        status: "active",
        createdAt: new Date("2026-09-29T08:39:53.079000+00:00"),
        updatedAt: new Date("2026-09-30T09:59:43.395000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abb795984731afe922b6574"),
        name: "normal user 1",
        email: "user@example.com",
        password: "$2b$10$ZiRWL9qwfo69a5RHTOjbu.sdFMjvYA9U7pcN8hC8fQiYW.9Fvsc.K",
        role: "user",
        status: "active",
        createdAt: new Date("2026-09-29T08:39:53.080000+00:00"),
        updatedAt: new Date("2026-09-30T10:18:45.846000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abb807aaeedae59c99c4088"),
        name: "Dhruv",
        email: "dhruv@example.com",
        password: "$2b$10$9D6aFviOtfd1r1egTm2vGO9ANG13SMBXBTpyXyG5jIObj8FSgoR7u",
        role: "user",
        status: "active",
        createdAt: new Date("2026-09-29T09:10:18.947000+00:00"),
        updatedAt: new Date("2026-09-29T09:10:18.947000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abbf1c5336458961ae4e1a3"),
        name: "Rahul Kumar",
        email: "rahul@example.com",
        password: "$2b$10$Cox9SPFVrcBJxKYetOwSn.1g8XSkBMlwjwvSB7QoB3OWNP2T8PKDS",
        role: "user",
        status: "active",
        createdAt: new Date("2026-09-29T17:13:41.790000+00:00"),
        updatedAt: new Date("2026-09-29T17:13:41.790000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abce8f6b628acfbeba78742"),
        name: "Dhruv1",
        email: "dhruv1@example.com",
        password: "$2b$10$dL3hqoMKVRsD1W6JZxbgkuhUO9nkFIX07/VaIlBTqQGWNWakuz0ju",
        role: "user",
        status: "active",
        createdAt: new Date("2026-09-30T10:48:22.880000+00:00"),
        updatedAt: new Date("2026-09-30T10:48:22.880000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abe035003ce6fcbf052139d"),
        name: "dhruv yadav",
        email: "dhruv1@gmail.com",
        password: "$2b$10$m.I61Rj4/4BcPZlnQsFi0eLiAxN8VAN3TxGb0hrXnYx6yzm0hgoji",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T06:53:04.245000+00:00"),
        updatedAt: new Date("2026-10-01T12:05:39.945000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abe4dfac6c1bc01ffc0d1f6"),
        name: "dhruv yadav1",
        email: "dhruv4@gmail.com",
        password: "$2b$10$WDXIMFcCYoNZyBAvzD4My.tN1Bie5drU8eEgqpucCNeU1avtuC2f6",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T12:11:38.016000+00:00"),
        updatedAt: new Date("2026-10-01T12:42:39.274000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abe93ace0ba3facfe79114d"),
        name: "Dhruv Yadav",
        email: "dhruv6@gmail.com",
        password: "$2b$10$Em4qQg69WZ/CACzNId.ZyO37DHLHIBx01uCo3KmfXx6eKt0MVlOnW",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T17:09:00.887000+00:00"),
        updatedAt: new Date("2026-10-01T17:47:29.237000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abec9a5afabf354a78051df"),
        name: "Dhruv Yadav",
        email: "dhruv8@gmail.com",
        password: "$2b$10$4sicB0RGExoT4TSSqWd3feIbSWum/yyVq23gr4gEKMaQZxOr9/c..",
        role: "admin",
        status: "active",
        createdAt: new Date("2026-10-01T20:59:17.053000+00:00"),
        updatedAt: new Date("2026-10-01T20:59:17.053000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abeccac5d09056ce1829335"),
        name: "Dhruv Yadav",
        email: "dhruv9@gmail.com",
        password: "$2b$10$CJYIATTxMhQnUQM8SMjmdO0vVEUWXysUxrmP1LT8vpmMjU8M9YnEK",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:12:12.757000+00:00"),
        updatedAt: new Date("2026-10-01T21:12:12.757000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abecd3c5d09056ce1829336"),
        name: "Dhruv Yadav",
        email: "dhruvyadav17@gmail.com",
        password: "$2b$10$30mRr1fwuEWi/wKY6QaA7ODAzn4GdpVslbce9dljf3UonB3LzYUGu",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:14:36.371000+00:00"),
        updatedAt: new Date("2026-10-01T21:14:36.371000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abece4e30ceda993c2c8ba7"),
        name: "Dhruv Yadav",
        email: "dhruv10@gmail.com",
        password: "$2b$10$fPAE0OgtPtX.sdcLj3lQIOprXk2JFSMBu0bTP9i0rldlRKCOIyjpy",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:19:10.256000+00:00"),
        updatedAt: new Date("2026-10-01T21:19:10.256000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abecf6268b044807766a263"),
        name: "Dhruv Yadav",
        email: "dhruv11@gmail.com",
        password: "$2b$10$KOEkzAlMvJhL2GQJCZY8cuMwKfv0QW5R0GEsy.E8zi2Zak60u2ECi",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:23:46.507000+00:00"),
        updatedAt: new Date("2026-10-01T21:23:46.507000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abecfcd4926e79156f71520"),
        name: "Dhruv Yadav",
        email: "dhruv12@gmail.com",
        password: "$2b$10$2VzAFIPKP03S7MrWy3DQK.HOCRoTfFaYiPFSyJQvxpBdIGruh/ULy",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:25:33.061000+00:00"),
        updatedAt: new Date("2026-10-01T21:25:33.061000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed04935860825dbf8745b"),
        name: "Dhruv Yadav",
        email: "dhruv13@gmail.com",
        password: "$2b$10$cSUOB4/QQ4oMJ9Fdo6Z44.0ydPvTuZotjv/KUvjIUgxLUiSJHTGUO",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:27:37.225000+00:00"),
        updatedAt: new Date("2026-10-01T21:27:37.225000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed0b8dbbefd508af0ceca"),
        name: "Dhruv Yadav",
        email: "dhruv14@gmail.com",
        password: "$2b$10$W..T2XuL0p0vz/AXA0K9Iedi/zBT8etc4Es7p/My23jKPXGFdhpce",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:29:28.872000+00:00"),
        updatedAt: new Date("2026-10-01T21:29:28.872000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed39de34bfe7fa2384d5d"),
        name: "Dhruv Yadav",
        email: "dhruv15@gmail.com",
        password: "$2b$10$FbRToGmm6sr/u4tspbP9Aex.pZcr1po9oSyM3.9YVK6ykwD0m8n22",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:41:49.045000+00:00"),
        updatedAt: new Date("2026-10-01T21:41:49.045000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed3f87b4bc068543585e8"),
        name: "Dhruv Yadav",
        email: "dhruv16@gmail.com",
        password: "$2b$10$jE/QnuqkTDQFqMKsrh0CSe/D3lgEf53y6ZVz0l3Ee/fWJ4pKuyv5G",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:43:20.690000+00:00"),
        updatedAt: new Date("2026-10-01T21:43:20.690000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed445845db1e2a6a1b888"),
        name: "Dhruv Yadav",
        email: "dhruv17@gmail.com",
        password: "$2b$10$g7gKHZCYlLXhZdNDYhM0QedcdZjGlUPQvN0NXb/cgvlKElpAr.SNe",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:44:37.435000+00:00"),
        updatedAt: new Date("2026-10-01T21:44:37.435000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abed63572b353c0470d7b76"),
        name: "Dhruv Yadav",
        email: "dhruv18@gmail.com",
        password: "$2b$10$lutoHTp5CXjGJDB1pXAp5ufqAqV.GsPH0uEsURNGcVOJwVUxByKFO",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T21:52:53.106000+00:00"),
        updatedAt: new Date("2026-10-01T21:52:53.106000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abedb522966762b66b93309"),
        name: "Dhruv Yadav",
        email: "dhruv19@gmail.com",
        password: "$2b$10$CafkPmufvCYo1qoFPvT5nee4LpK4GmHMqVjD9iIFrVROgrXz1UrZ2",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T22:14:42.841000+00:00"),
        updatedAt: new Date("2026-10-01T22:14:42.841000+00:00"),
        __v: 0,
        authVersion: 0
    },
    {
        _id: new mongoose.Types.ObjectId("6abedb7a2966762b66b9330a"),
        name: "Dhruv Yadav",
        email: "dhruv20@gmail.com",
        password: "$2b$10$e2CH2ZRESjeheGAX2y2Tlep5e.9RMw.vtxpz69ltjWJGgDHo8562q",
        role: "user",
        status: "active",
        createdAt: new Date("2026-10-01T22:15:22.961000+00:00"),
        updatedAt: new Date("2026-10-01T22:15:22.961000+00:00"),
        __v: 0,
        authVersion: 0
    }
];

users.forEach((user) => { user.permissionOverrides = { allow: [], deny: [] }; });

async function seedUsers() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(mongoUri);

    try {
        for (const user of users) {
            const { _id, ...updateFields } = user;

            const existing = await User.findOne({ email: user.email })
                .select("_id")
                .lean();

            if (existing) {
                delete updateFields.permissionOverrides;
                await User.updateOne(
                    { email: user.email },
                    { $set: updateFields, $setOnInsert: { permissionOverrides: { allow: [], deny: [] } } }
                );
                console.log(`Updated: ${user.email}`);
            } else {
                await User.create(user);
                console.log(`Inserted: ${user.email}`);
            }
        }

        console.log(`Seed complete. Processed ${users.length} users.`);
    } finally {
        await mongoose.disconnect();
    }
}

seedUsers().catch((error) => {
    console.error("User seed failed:", error);
    process.exitCode = 1;
});
