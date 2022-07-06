const cron = require("node-cron");
const mysql = require("mysql2/promise");
const mailer = require("nodemailer");
const { mysqlConfig, nodeMailerConfig } = require("./config");

const sendEmail = async (email, text) => {
  try {
    let transporter = await mailer.createTransport({
      host: nodeMailerConfig.host,
      port: nodeMailerConfig.port,
      secure: true,
      auth: {
        user: nodeMailerConfig.user,
        pass: nodeMailerConfig.pass,
      },
    });

    let config = await transporter.sendMail({
      from: `"Pill" <${nodeMailerConfig.user}>`,
      to: email,
      subject: "Notification",
      text: text,
    });
    return console.log(config);
  } catch (err) {
    console.log(err);
  }
};

const getData = async () => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(
      `SELECT users.email,  users_medications.time, users_medications.title, users_medications.dosage, users_medications.units FROM users_medications LEFT JOIN users ON users.id = users_medications.user_id`
    );
    await con.end();
    if (data.length === 0) {
      return console.log("error");
    }
    return data;
  } catch (err) {
    console.log(err);
  }
};

const bot = cron.schedule(`15 * * * *`, async () => {
  try {
    const currentTime = new Date().getHours().toLocaleString("en-US", {
      timeZone: "Europe/Riga",
    });
    console.log(currentTime);
    const data = await getData();
    data
      .map((item) => {
        return {
          ...item,
          time: item.time.split(","),
        };
      })
      .forEach((y) => {
        if (y.time.some((x) => x == currentTime)) {
          const text = `Hello, dont forget to take ${y.dosage} ${y.units} of  ${y.title}`;
          return sendEmail(y.email, text);
        } else {
          console.log("not yet...");
        }
      });
  } catch (err) {
    console.log(err);
  }
});

bot.start();
