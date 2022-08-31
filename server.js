const express = require("express");
const joyas = require("./data/joyas.js");
const app = express();
const csp = require('content-security-policy');

const cspPolicy = {
  'report-uri': '/reporting',
  'default-src': csp.SRC_USAFE_INLINE,
  'script-src': [ csp.SRC_SELF, csp.SRC_DATA ]
};

const globalCSP = csp.getCSP(csp.STARTER_OPTIONS);
const localCSP = csp.getCSP(cspPolicy);

app.use(express.static("public"));

app.use(localCSP); 


/*
app.use((req, res, next) => {

  res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Content-Security-Policy": "default-src *",
      "X-Content-Security-Policy": "default-src *",
      "X-WebKit-CSP": "default-src *"
  })
  next();
});
*/

const jewel = (id) => {
  return joyas.results.find((j) => j.id == id);
};

const filtroByCategory = (category) => {
  return joyas.results.filter((j) => j.category === category);
};

const fieldsSelect = (jewel, fields) => {
  for (property in jewel) {
    if (!fields.includes(property)) delete jewel[property];
  }
  return jewel;
};

const orderValues = (order) => {
  return order == "asc"
    ? joyas.results.sort((a, b) => (a.value > b.value ? 1 : -1))
    : order == "desc"
    ? joyas.results.sort((a, b) => (a.value < b.value ? 1 : -1))
    : false;
};

const HATEOASV1 = () =>
  joyas.results.map((j) => {
    return {
      name: j.name,
      href: `http://localhost:3000/joya/${j.id}`,
    };
  });

const HATEOASV2 = () =>
  joyas.results.map((j) => {
    return {
      jewel: j.name,
      src: `http://localhost:3000/jewel/${j.id}`,
    };
  });


app.get("/", (req, res) => {
  res.send(joyas);
});

app.get("/api/v1/joyas", (req, res) => {
  res.send({
    joyas: HATEOASV1(),
  });
});

app.get("/api/v2/jewels", (req, res) => {
  res.send({
    jewels: HATEOASV2(),
  });
});

app.get("/api/v2/jewels/:category", (req, res) => {
  const category = req.params.category;
  res.send({
    cant: filtroByCategory(category).length,
    jewels: filtroByCategory(category),
  });
});

app.get("/api/v2/jewels", (req, res) => {
  const { values } = req.query;
  if (values == "asc") return res.send(orderValues("asc"));
  if (values == "desc") return res.send(orderValues("desc"));
  if (req.query.page) {
    const { page } = req.query;
    return res.send({ jewels: HATEOASV2().slice(page * 2 - 2, page * 2) });
  }
  res.send({
    jewels: HATEOASV2(),
  });
});

app.get("/api/v2/jewel/:id", (req, res) => {
  const { id } = req.params;
  const { fields } = req.query;
  if (fields)
    return res.send({
      jewel: fieldsSelect(jewel(id), fields.split(",")),
    });
  jewel(id)
    ? res.send({
        jewel: jewel(id),
      })
    : res.status(404).send({
        error: "404 Not Found",
        message: "Don't exist a jewel with that id",
      });
});

app.listen(3000, () => console.log("Your app listening on port 3000"));
