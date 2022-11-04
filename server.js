
/************************************************************************* 
* WEB322– Assignment 4 
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
* No part of this assignment has been copied manually or electronically from any other source. 
* (including 3rd party web sites) or distributed to other students. * 

* Name: Mehrad Akbari Student ID: 130077217  Date: 03-11-2022 * 

* Your app’s URL (from Heroku) that I can click to see your application:
* ______________________________________________ 

* *************************************************************************/
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const handleBars = require('express-handlebars')

const dataService = require('./data-service')
const { isTypedArray } = require('util/types')

require('dotenv').config()


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/uploaded')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})


const app = express()

const port = process.env.PORT

const upload = multer({ storage: storage })

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});
app.engine('.hbs', handleBars.engine({
    extname: '.hbs', helpers: {
        navLink: function (url, options) {
            if (url == app.locals.activeRoute) {
                return `<a href="${url}" class="link active">${options.fn(this)}</a>`
            } else {
                return `<a href="${url}" class="link">${options.fn(this)}</a>`
            }
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }

    }
}));
app.set('view engine', '.hbs');


// routes

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/about', (req, res) => {
    res.render('about')
})

app.get('/employees', (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status)
            .then((data) => { return res.render('employees', { employees: data }) })
            .catch(err => console.log(err))
    }
    if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager)
            .then((data) => { return res.render('employees', { employees: data }) })
            .catch(err => console.log(err))
    }
    if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department)
            .then((data) => { return res.render('employees', { employees: data }) })
            .catch(err => console.log(err))
    }
    dataService.getAllEmployees()
        .then(data => { return res.render('employees', { employees: data }) })
        .catch(err => console.log(err))

})
app.get('/employee/:number', (req, res) => {
    dataService.getEmployeeByNum(req.params.number)
        .then(data => { res.render('employee', { employee: data }) })
        .catch(err => res.render("employee", { message: "no results" }))
})
app.get('/managers', (req, res) => {
    dataService.getManagers()
        .then(data => res.json(data))
        .catch(err => console.log(err))
})
app.get('/departments', (req, res) => {
    dataService.getDepartments()
        .then(data => res.render('departments', { departments: data }))
        .catch(err => console.log(err))
})
app.get('/employees/add', (req, res) => {
    res.render('addEmployee')
})

app.get('/images/add', (req, res) => {
    res.render('addImage')
})
app.post('/images/add', upload.single("imageFile"), (req, res) => {
    res.redirect('/images')
})
app.get('/images', (req, res) => {
    fs.readdir("./public/images/uploaded", function (err, items) {
        if (err) return res.render('images', { message: err })
        res.render('images', { data: items })
    })
})

app.post('/employee/update', (req, res) => {
    dataService.updateEmployee(req.body).then(res.redirect('/employees'))
})
app.post('/employees/add', (req, res) => {
    dataService.addEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch(err => console.log(err))
})
// 404 not found
app.get('*', function (req, res) {
    res.render('404')
})


// starting the server
dataService.initialize()
    .then(
        app.listen(port, () => {
            console.log(`Express http server listening on ${port}`)
        })
    )
    .catch(err => console.log(err))