const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv');

const app = express();
dotenv.config();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;


mongoose.connect(`mongodb+srv://${USERNAME}:${PASSWORD}@cluster0.rhztp.mongodb.net/todolistDB`, { useNewURLParser: true }); // connecting to our Database todolistDB

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}, function (err, foundItem) {

    if (foundItem.length === 0) {

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully saved default items to DB.")
        }
      });
      res.redirect("/"); // once the default items are inserted into the empty array, we redirect the page to the home page where this time, the array is non-empty so it'll fall in the else condition
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItem });
    }

  });

});



app.get("/:customListName", function (req, res) {
  const custListName = _.capitalize(req.params.customListName);

  List.findOne({ name: custListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: custListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + custListName); // redirect to the /custListName page, now the next when the document has already been created, the flow control will move to the else block, where it'll get rendered
      }
      else {
        // Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })


});



app.post("/", function (req, res) {

  const itemName = req.body.newItem; // getting the input item from the form and storing it in itemName
  const listName = req.body.list;

  const item = new Item({ // creating a document item, with the value of the name field equal to the input item
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);

    });
  }



});



app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});



app.get("/about", function (req, res) {
  res.render("about");
});



// process.env.PORT dynamically assings the server which heroku provides us
app.listen(process.env.PORT || 3000, function () { // using || allows the server to run on either of the two, if one is not working
  console.log("Server is running successfully.");
});
