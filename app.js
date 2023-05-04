const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1/todolistDB")

const itemSchema = new mongoose.Schema({
    name: String
})

const customListSchema = new mongoose.Schema({
    name: String,
    item:[itemSchema]
})

const Item = mongoose.model("Item", itemSchema)
const CustomList = mongoose.model("CustomList", customListSchema)

const defaultItems = [{
    name: "Buy food"
},
{
    name: "cook food"
},
{
    name: "eat food"
}]


app.get("/", function(req, res){  
    Item.find().then((itemsData) =>{
        if (itemsData.length === 0){
            Item.insertMany(defaultItems).then((data)=>{
                console.log("Default items are inserted to the list.")
            })
            res.redirect("/")
        }else{
            res.render("list", {listTitle: "Today", newItem: itemsData});
        }
    })
});

app.get("/:ListName", function(req, res){
    const customListName = _.capitalize(req.params.ListName);
    CustomList.findOne({name: customListName}).then((data)=>{
        if(data === null) {
            const customListData = CustomList.insertMany({name: customListName, item: defaultItems})
            res.redirect("/"+customListName)
        }else{
            res.render("list", {listTitle: data.name, newItem: data.item})
        }
    })
});




app.get("/about", function(req, res){
    res.render("about");
});


app.post("/", function(req, res){
    const item=req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: item
    })
    if (listName === "Today"){
        newItem.save()
        res.redirect("/")
    } else {
        CustomList.findOne({name: listName}).then((data)=>{
            data.item.push(newItem)
            data.save();
            res.redirect("/"+listName)
        })
    }

});


app.post("/deleteItem", function(req, res){
    const item = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today"){
        Item.findByIdAndRemove({_id: item}).then((data)=>{
            res.redirect("/")
        })
    } else {

        CustomList.findOneAndUpdate({name: listName},{$pull: {item: {_id: item}}}).then((data)=>{
            res.redirect("/"+listName)
        })
    }

})

app.listen(3000, function(){
    console.log("Server is up and running at port: 3000");
});