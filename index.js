/**
 * Forward to forum
 * @param {Express.Request} req The API request.
 * @param {Express.Response} res The API response.
 */
const turndownService = require("turndown-async");
const axios = require("axios");
exports.forwardToForum = async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");

    // Handle CORS
    if (req.method === "OPTIONS") {
      // Send response to OPTIONS requests
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Max-Age", "3600");
      res.status(204).send("");
    }

    const html = req.body.html;
    if (html.match(/gmail_quote/g) !== null) {
      // Filter if it's a thread reply, indicated by `gmail_quote` class,
      // Then do not forward
      return res.sendStatus(404);
    }

    const turndown = new turndownService();
    const endpoint = process.env.ENDPOINT;
    const token = process.env.TOKEN;
    const title = req.body.subject;
    const msg = html.split("-- <br />")[0];
    const md = await turndown.turndown(msg);
    axios
      .post(
        endpoint,
        {
          data: {
            type: "discussions",
            attributes: {
              title: title,
              content: md,
            },
            relationships: {
              tags: { data: [{ type: "tags", id: process.env.TAG_ID }] },
            },
          },
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return res.send(response.data.data.id);
      })
      .catch((error) => {
        console.log(error);
        return res.send({ error });
      });
  } catch (error) {
    console.log(error);
    return res.send({
      e: error,
    });
  }
};
