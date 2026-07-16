const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes("<db_password>")) {
  console.error(
    "Error: Please set your MONGODB_URI with the correct password in backend/.env before running the seed script.",
  );
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const db = client.db();

    // Clean existing database
    await db.collection("users").deleteMany({});
    await db.collection("content").deleteMany({});
    await db.collection("batches").deleteMany({});
    await db.collection("attendance").deleteMany({});
    await db.collection("fee_payments").deleteMany({});
    console.log("Cleared existing collections.");

    // Hash passwords
    const teacherPasswordHash = await bcrypt.hash("teacher123", 10);
    const studentPasswordHash = await bcrypt.hash("student123", 10);

    // Create users list
    const users = [];

    // Teacher User
    const teacherUser = {
      username: "neeraja",
      password: teacherPasswordHash,
      role: "teacher",
      createdAt: new Date(),
    };
    users.push(teacherUser);

    // Student Usernames (16 students total, including keshvi)
    const studentUsernames = [
      "keshvi",
      "priya",
      "ananya",
      "sneha",
      "riya",
      "meera",
      "isha",
      "tanya",
      "divya",
      "aditi",
      "kavya",
      "shruti",
      "pooja",
      "neha",
      "riddhi",
      "siddhi",
    ];

    studentUsernames.forEach((username) => {
      users.push({
        username,
        password: studentPasswordHash,
        role: "student",
        batchId: null,
        createdAt: new Date(),
      });
    });

    await db.collection("users").insertMany(users);
    console.log(`Inserted ${users.length} users.`);

    // Retrieve inserted student users to map their IDs
    const dbUsers = await db
      .collection("users")
      .find({ role: "student" })
      .toArray();

    // Create 4 evening batches
    const batchData = [
      { name: "4-5 PM Batch", timeSlot: "16:00 - 17:00", students: [] },
      { name: "5-6 PM Batch", timeSlot: "17:00 - 18:00", students: [] },
      { name: "6-7 PM Batch", timeSlot: "18:00 - 19:00", students: [] },
      { name: "7-8 PM Batch", timeSlot: "19:00 - 20:00", students: [] },
    ];

    // Distribute students evenly (4 students per batch)
    const batchOids = [];
    for (let i = 0; i < batchData.length; i++) {
      const batchStudents = dbUsers.slice(i * 4, (i + 1) * 4);
      batchData[i].students = batchStudents.map((u) => u.username);

      const insertBatch = await db
        .collection("batches")
        .insertOne(batchData[i]);
      const batchId = insertBatch.insertedId;
      batchOids.push(batchId);

      // Update student user batchId linkages
      const studentIds = batchStudents.map((u) => u._id);
      await db
        .collection("users")
        .updateMany(
          { _id: { $in: studentIds } },
          { $set: { batchId: batchId } },
        );
    }
    console.log("Created 4 batches and distributed students.");

    // Create Curriculum Content
    const content = [
      {
        title: "Bharatanatyam Introduction",
        name: "Bharatanatyam Introduction",
        description:
          "Bharatanatyam is one of the oldest and most celebrated classical dance forms of India. It originated in the southern state of Tamil Nadu and is known for its graceful movements, expressive storytelling, intricate footwork, and strong rhythmic patterns. More than just a dance, Bharatanatyam is considered a spiritual art form that combines music, rhythm, literature, and devotion to convey emotions and stories from Hindu mythology.\n\nThe word Bharatanatyam is often interpreted as:\n\nBha – Bhava (Expression or Emotion)\nRa – Raga (Melody)\nTa – Tala (Rhythm)\nNatyam – Dance or Dramatic Performance\n\nTogether, these elements represent the harmony of expression, music, rhythm, and movement.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "History of Bharatanatyam",
        name: "History of Bharatanatyam",
        description:
          "The roots of Bharatanatyam date back over 2,000 years and are closely associated with the ancient Indian treatise on performing arts, the Natya Shastra, written by the sage Bharata Muni around 200 BCE–200 CE. The Natya Shastra laid down the principles of dance, drama, music, expressions, gestures, costumes, and stagecraft that continue to influence Bharatanatyam today.\n\nHistorically, Bharatanatyam was performed in Hindu temples by women known as Devadasis (servants of God). These dancers dedicated their lives to serving the deity through dance and music. Their performances were considered acts of worship rather than entertainment and were an integral part of temple rituals.\n\nDuring the medieval period, Bharatanatyam flourished under the patronage of the Chola, Pandya, and Vijayanagara dynasties, with magnificent temples becoming centers for dance and music. Temple sculptures from this era depict many Bharatanatyam poses, reflecting the dance's cultural significance.\n\nHowever, during British colonial rule in the 19th century, the Devadasi system came under criticism, and Bharatanatyam faced social stigma and decline. The dance was discouraged and nearly disappeared.\n\nIn the early 20th century, cultural reformers and artists such as Rukmini Devi Arundale, E. Krishna Iyer, and the Tanjore Quartet played a crucial role in reviving Bharatanatyam. They restructured its performance format, brought it from temples to public stages, and established it as a respected classical dance performed worldwide.\n\nToday, Bharatanatyam is recognized internationally as one of India's foremost classical dance traditions and is taught and performed across the globe.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Origin of Bharatanatyam",
        name: "Origin of Bharatanatyam",
        description:
          "Bharatanatyam originated in the temples of Tamil Nadu, particularly in regions such as Thanjavur (Tanjore), which became an important center for its development.\n\nThe dance evolved from the ancient temple dance known as Sadir or Dasi Attam, performed by Devadasis as part of daily temple worship. The spiritual purpose of the dance was to express devotion (Bhakti) toward the deity through movement, music, and storytelling.\n\nThe Tanjore Quartet—Chinnayya, Ponnayya, Sivanandam, and Vadivelu—organized Bharatanatyam into the structured recital format (Margam) that is still followed today. This format includes items such as Alarippu, Jatiswaram, Shabdam, Varnam, Padam, Tillana, and Mangalam.\n\nBharatanatyam combines three major aspects:\n\nNritta – Pure dance with rhythmic movements.\nNritya – Expressive dance that conveys emotions and stories.\nNatya – Dramatic storytelling through dance.\n\nThese elements together make Bharatanatyam a complete performing art.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Tala (Rhythm)",
        name: "Tala (Rhythm)",
        description:
          "Tala is the rhythmic framework that organizes time in Bharatanatyam. Just as melody gives shape to music, tala provides structure and timing to dance movements. Every step, gesture, and sequence in Bharatanatyam is performed according to a specific tala.\n\nA tala consists of repeating cycles called Avartanas, which are divided into beats known as Aksharas.\n\nSome commonly used talas in Bharatanatyam include:\n\nAdi Tala – 8 beats (most commonly used)\nRupaka Tala – 6 beats\nMisra Chapu Tala – 7 beats\nKhanda Chapu Tala – 5 beats\n\nThe dancer synchronizes footwork (Adavus) with the tala, creating harmony between movement and music. The rhythmic syllables recited by the Nattuvanar (dance conductor) help the dancer maintain precision and timing.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Laya (Tempo)",
        name: "Laya (Tempo)",
        description:
          "Laya refers to the speed or tempo at which the dance is performed. It determines how fast or slow the rhythmic cycle progresses while maintaining a steady flow.\n\nThe three primary types of laya are:\n\nVilambit Laya (Slow Tempo)\n- Graceful and deliberate movements.\n- Allows expressive storytelling and detailed facial expressions.\n- Commonly used in devotional or emotional pieces.\n\nMadhya Laya (Medium Tempo)\n- Balanced speed.\n- Most Bharatanatyam compositions are performed in this tempo.\n- Combines rhythmic movement with expressive dance.\n\nDrut Laya (Fast Tempo)\n- Quick and energetic movements.\n- Requires precision, stamina, and excellent control.\n- Frequently seen in rhythmic finales like Tillana.\n\nMaintaining a consistent laya is essential because even complex footwork must remain synchronized with the tala.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Jaati (Jati)",
        name: "Jaati (Jati)",
        description:
          "Jaati refers to the rhythmic grouping or numerical pattern of beats used within a tala. It determines how many counts are assigned to a particular rhythmic unit and greatly influences the complexity of dance compositions.\n\nThe five principal jatis are:\n- Tisra Jaati: 3 beats\n- Chatusra Jaati: 4 beats\n- Khanda Jaati: 5 beats\n- Misra Jaati: 7 beats\n- Sankirna Jaati: 9 beats\n\nFor example:\n- Tisra creates a three-beat rhythmic pattern.\n- Chatusra is the most commonly used four-beat pattern.\n- Khanda, Misra, and Sankirna introduce increasingly complex rhythmic structures.\n\nJaatis are especially important in Jatiswaram, Varnam, and rhythmic dance passages where intricate footwork and mathematical precision are emphasized.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Relationship Between Tala, Laya, and Jaati",
        name: "Relationship Between Tala, Laya, and Jaati",
        description:
          "Although closely related, these three concepts have distinct roles:\n\nTala provides the overall rhythmic cycle or time framework.\nLaya determines the speed at which the tala is performed.\nJaati defines the numerical grouping of beats within the rhythmic structure.\n\nFor example, a Bharatanatyam performance may use Adi Tala (8-beat cycle), performed in Madhya Laya (medium tempo), with rhythmic sequences based on Tisra or Khanda Jaati, creating different rhythmic textures while remaining within the same tala.",
        type: "theory",
        imageLink: "",
        videoLink: "",
        createdAt: new Date(),
      },
      {
        title: "Asamyukta Hastas",
        name: "Asamyukta Hastas",
        description:
          "Asamyukta Hastas are single-hand gestures. In Bharatanatyam, there are 28 basic single-hand gestures described in the Abhinaya Darpanam, used to denote various actions, feelings, and objects during storytelling.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=bi5oVX0Sp9s&pp=ygUdYXN1bWtodGEgaGFzdHlhIGJoYXJhdGFuYXR5YW0%3D",
        createdAt: new Date(),
      },
      {
        title: "Pataka Hasta Viniyoga",
        name: "Pataka Hasta Viniyoga",
        description:
          "Pataka means flag. It is the first of the Asamyuta (single hand) mudras. The fingers are extended, held close together, and the thumb is bent. The Viniyoga (applications) include representing clouds, forest, night, river, wind, or showing a blessing.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=hej_iqo-xEM&pp=ygUUbmF0eWFyYW1iaGUgdmFyaXZhaGU%3D",
        createdAt: new Date(),
      },
      {
        title: "Tripataka Hasta Viniyoga",
        name: "Tripataka Hasta Viniyoga",
        description:
          "Tripataka means flag with three parts. It is formed by bending the ring finger of the Pataka hand. Its Viniyogas include depicting a crown, tree, arrow, thunderbolt, or a flame.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=ogCE5IIDpCM&pp=ygUYdHJpcGF0YWthIGhhc3RhIHZpbml5b2dh",
        createdAt: new Date(),
      },
      {
        title: "Ardha Pataka Hasta Viniyoga",
        name: "Ardha Pataka Hasta Viniyoga",
        description:
          "Ardha Pataka means half flag. It is formed by bending the little finger of the Tripataka mudra. Its Viniyogas include denoting a leaf, board, bank of a river, dagger, flag, horn, or two objects.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=c4nGxGoO8-I&pp=ygUZYXJkaHBhdGFrYSBoYXN0YSB2aW5peW9nYQ%3D%3D",
        createdAt: new Date(),
      },
      {
        title: "Kartari Hasta Viniyoga",
        name: "Kartari Hasta Viniyoga",
        description:
          "Kartarimukha means scissors' face. It is formed by extending the index and middle fingers in a 'V' shape, while the little and ring fingers touch the thumb. Its Viniyogas include depicting scissors, opposition, separation, or lightning.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=3LB2qAcWUYc&pp=ygUZYXJkaHBhdGFrYSBoYXN0YSB2aW5peW9nYQ%3D%3D",
        createdAt: new Date(),
      },
      {
        title: "Mayura Hasta Viniyoga",
        name: "Mayura Hasta Viniyoga",
        description:
          "Mayura means peacock. It is formed by bringing the tip of the ring finger to touch the thumb, while the other fingers are held straight and close together. Its Viniyogas represent a peacock, creeper, bird, or applying vermilion.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=tPAyqWwN4PY&pp=ygUVbWF5dXJhIGhhc3RhIHZpbml5b2dh",
        createdAt: new Date(),
      },
      {
        title: "Ardhachandra Hasta Viniyoga",
        name: "Ardhachandra Hasta Viniyoga",
        description:
          "Ardhachandra means half moon. It is formed by stretching the thumb outward while holding the other fingers close together, resembling a crescent moon. Its Viniyogas include depicting the moon, a hand grabbing a throat, a spear, or a platter.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1505506819641-4ad45cd8079f?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=ARy0XvzdDJk&pp=ygUaYXJkaGNoYW5kcmEgaGFzdGEgdmluaXlvZ2HSBwkJlQsBhyohjO8%3D",
        createdAt: new Date(),
      },
      {
        title: "Arala and Sukatunda Hasta Viniyoga",
        name: "Arala and Sukatunda Hasta Viniyoga",
        description:
          "Arala means bent or curved, formed by bending the index finger of the Pataka hand. Sukatunda means parrot's head, formed by bending the ring finger as well. They are used to represent drinking poison, wind, or shooting an arrow.",
        type: "mudra",
        imageLink:
          "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&q=80",
        videoLink:
          "https://www.youtube.com/watch?v=Pkybh_Wze6o&pp=ygUUYXJhbGEgaGFzdGEgdmluaXlvZ2HSBwkJlQsBhyohjO8%3D",
        createdAt: new Date(),
      },
      {
        title: "Tatta Adavu",
        name: "Tatta Adavu",
        description:
          "Tatta Adavu is the first series of steps in Bharatanatyam, focusing purely on flat-foot tapping. There are 8 variations, progressively increasing in speed and rhythmic beats. It is danced in Araimandi (half-sitting posture) and trains the dancer's stability, leg strength, and rhythm.",
        type: "adavu",
        imageLink: "",
        videoLink: "https://www.youtube.com/embed/hrXxqPRtPYk",
        createdAt: new Date(),
      },
      {
        title: "Natta Adavu",
        name: "Natta Adavu",
        description:
          "Natta Adavu is the second series of steps, which introduces stretching and touching the heel to the floor. It involves striking with the heels and flat foot coordination, along with hand mudras moving in coordinate circles. It emphasizes side-to-side stretching.",
        type: "adavu",
        imageLink: "",
        videoLink: "https://www.youtube.com/embed/YNwZdeKRraI",
        createdAt: new Date(),
      },
      {
        title: "Kuditta Mettu Adavu",
        name: "Kuditta Mettu Adavu",
        description:
          "Kuditta Mettu translates to jumping and striking. The dancer jumps up onto the toes (kuditta) and strikes the heels down flat (mettu) in Araimandi posture. It is a highly dynamic series that builds ankle flexibility and calf strength.",
        type: "adavu",
        imageLink: "",
        videoLink: "https://www.youtube.com/embed/br5-2-J-XlY",
        createdAt: new Date(),
      },
      {
        title: "Tisra Alarippu",
        name: "Tisra Alarippu",
        description:
          "Alarippu is the traditional invocatory item in a Bharatanatyam recital. Set to a three-beat Tisra rhythm, it centers on pure rhythmic movement (Nritta) to gain flexibility and pay respect to God, teacher, and audience.",
        type: "adavu",
        imageLink: "",
        videoLink: "https://www.youtube.com/embed/aBgK7lQi86o",
        createdAt: new Date(),
      },
      {
        title: "Jatiswaram",
        name: "Jatiswaram",
        description:
          "Jatiswaram is a technical dance sequence combining rhythmic beat patterns (Jatis) with musical note configurations (Swaras). It features no storytelling, showcasing fast-paced body extensions and foot tapping.",
        type: "adavu",
        imageLink: "",
        videoLink: "https://www.youtube.com/embed/NRuOxNLC_Lw",
        createdAt: new Date(),
      },
    ];

    await db.collection("content").insertMany(content);
    console.log("Seeded curriculum content (theory, mudras, adavus).");

    // Generate 1000+ Attendance Logs & Fee Records spanning 6 months
    console.log("Generating 1000+ attendance & payment records...");
    const attendanceLogs = [];
    const paymentRecords = [];

    // Setup dates for class logs: Mon, Wed, Fri classes over the last 180 days (approx 6 months)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180); // 6 months ago

    const classDates = [];
    const curr = new Date(startDate);
    const today = new Date();

    while (curr <= today) {
      const day = curr.getDay();
      if (day === 1 || day === 3 || day === 5) {
        // Mon = 1, Wed = 3, Fri = 5
        classDates.push(curr.toISOString().split("T")[0]);
      }
      curr.setDate(curr.getDate() + 1);
    }
    console.log(
      `Identified ${classDates.length} class dates in the last 6 months.`,
    );

    // 1. Generate Attendance (78 dates * 16 students = 1248 logs)
    for (const date of classDates) {
      for (const student of dbUsers) {
        // Attendance status: 88% chance present, 12% absent
        const status = Math.random() > 0.12 ? "present" : "absent";
        attendanceLogs.push({
          username: student.username,
          batchId: student.batchId,
          date,
          status,
          createdAt: new Date(),
        });
      }
    }

    await db.collection("attendance").insertMany(attendanceLogs);
    console.log(
      `Successfully seeded ${attendanceLogs.length} attendance records.`,
    );

    // 2. Generate Fee Payments: 6 monthly cycles for each student
    const months = [
      { name: "Jan 2026", dueDate: "2026-01-05", payStatusChance: 0.98 },
      { name: "Feb 2026", dueDate: "2026-02-05", payStatusChance: 0.97 },
      { name: "Mar 2026", dueDate: "2026-03-05", payStatusChance: 0.95 },
      { name: "Apr 2026", dueDate: "2026-04-05", payStatusChance: 0.92 },
      { name: "May 2026", dueDate: "2026-05-05", payStatusChance: 0.85 },
      { name: "Jun 2026", dueDate: "2026-06-05", payStatusChance: 0.7 },
      { name: "Jul 2026", dueDate: "2026-07-05", payStatusChance: 0.4 }, // Current month - higher unpaid chance
    ];

    for (const month of months) {
      for (const student of dbUsers) {
        const isPaid = Math.random() < month.payStatusChance;
        const paidDate = isPaid
          ? new Date(
              new Date(month.dueDate).getTime() +
                Math.random() * 5 * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split("T")[0] // Paid within 5 days of due date
          : null;

        paymentRecords.push({
          username: student.username,
          planType: "Monthly",
          amount: 100, // $100 / month
          status: isPaid ? "paid" : "unpaid",
          dueDate: month.dueDate,
          paidDate,
          monthName: month.name,
        });
      }
    }

    await db.collection("fee_payments").insertMany(paymentRecords);
    console.log(
      `Successfully seeded ${paymentRecords.length} fee payment records.`,
    );

    console.log("Database successfully seeded!");
  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await client.close();
  }
}

seed();
