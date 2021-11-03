// MY TEST SCRAPING CODE BELOW

const cheerio = require('cheerio') // import cheerio module using commonJS
const cors = require('cors') // import cors to allow fetching the api from a different browser

// initializing the cors middleware
const cors_inst = cors({
  methods: ['POST'],
})

// helper method to wait for a middleware to execute before continuing
// and to throw an error when an error happens in a middleware
function runMiddleware (req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

var months = {
    'Jan' : '01',
    'Feb' : '02',
    'Mar' : '03',
    'Apr' : '04',
    'May' : '05',
    'Jun' : '06',
    'Jul' : '07',
    'Aug' : '08',
    'Sep' : '09',
    'Oct' : '10',
    'Nov' : '11',
    'Dec' : '12'
}

export default async (req, res) => { // export the function
  await runMiddleware(req, res, cors_inst)
  if (req.method === 'POST') { // if the request is a post
    const investor = req.body.investor // not using currently

    try { // try to scrape the list of superinvestors and the URLs for their portfolios
      var response = await fetch("https://www.dataroma.com/m/home.php")
      var htmlString = await response.text()
      var $ = cheerio.load(htmlString)

      // grab the giant string consisting of the entire list of superinvestors
      const investorList = $('span#port_body').text()
      // split the string by the year, which we can discard as all dates are 2021;
      // not the best solution but much simpler than a perfect one
      var tempList = investorList.split(" 2021 ")
      var investors = []
      var updated = []
      // for each entry in the list split into the name and update date
      // error is somewhere in here ( go line by line )
      for (let i = 0; i < tempList.length - 1; i++) {
        let str = ""
        if (i === 0)
          str = tempList[i].substring(1)
        else if (i === 5)
          str = tempList[i].substring(14)
        else
          str = tempList[i]

        let helperList = str.split(" Updated ")
        investors[i] = helperList[0]
        //console.log(helperList[0])
        let date = helperList[1]
        //console.log(date)
        let tokens = date ? date.split(" ") : false
        //console.log(tokens)
        updated[i] = tokens ? `2021-${months[tokens[1]]}-${tokens[0]}` : false
        //console.log(updated[i])
      }

      // grab investor portfolio URLs
      var links = []
      const rawLinks = $('a', 'span#port_body')//.attr('href');
      $(rawLinks).each(function(i, entry) {
        let sop = $(entry).attr('href');
        links[i] = 'https://www.dataroma.com' + sop;  // put local url in array
      });
      console.log(links)

      /*
      response = await fetch(links[0])
      htmlString = await response.text()
      $ = cheerio.load(htmlString)
      const table = $('td', 'table#grid')
      console.log(table)
      console.log(table.length)
      holder = []
      $(table).each(function(i, entry) {
        holder[i] = $(this).html();
      });
      console.log(holder)
      console.log(holder.length)
      */

      res.statusCode = 200
      return res.json({
        investors: tempList,
        error: "None",
        status: 200,
        updated: updated,
        //links: links,
      })
    } catch (e) { // handle the potential error that may occur if the data can't be found
      res.statusCode = 404
      return res.json({
        investors: "None",
        error: "An exception was thrown",
        status: 404,
      })
    }
  }
}