## Updates

### November 15th, 2023

- [John Hopkins University (JHU)](https://coronavirus.jhu.edu/map.html) has stopped collecting data as of March 10th, 2023.
- Here is JHU's [GitHub repository](https://github.com/CSSEGISandData/COVID-19).
- First data entry is 2020-01-22, last one is 2023-03-09.
- The data isn't updated anymore and is available in this cluster in readonly mode.

```
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/
```

### August 20th, 2020

- Removed links to Thomas's dashboard as it's not supported anymore.
- Updated some Charts in the dashboard as [JHU discontinued the recovered cases](https://github.com/CSSEGISandData/COVID-19/issues/4465).

### April 21st, 2020

- [MongoDB Open Data COVID-19](https://www.mongodb.com/developer/article/johns-hopkins-university-covid-19-data-atlas/) is now available on the new [MongoDB Developer Hub](https://www.mongodb.com/developer/).
- You can check our code samples in [our Github repository](https://github.com/mongodb-developer/open-data-covid-19).
- The JHU dataset changed again a few times. It's not really stable and it makes it complicated to build something reliable on top of this service. This is the reason why we created our more accessible version of the JHU dataset.
- It's the same data but transformed in JSON documents and available in a readonly MongoDB Cluster we built for you.

### March 24th, 2020

- [Johns Hopkins University](https://www.jhu.edu/) changed the dataset they release daily.
- I created a [new dashboard based using the new dataset](https://charts.mongodb.com/charts-open-data-covid-19-zddgb/public/dashboards/60da4f45-f168-434a-82f6-d37ce88ff9ea).
- My new dashboard updates **automatically every hour** as new data comes in.

## Too Long, Didn't Read

[Thomas Rueckstiess](https://www.linkedin.com/in/rueckstiess/) and [myself](https://www.linkedin.com/in/maximebeugnet) came up with two [MongoDB Charts](https://www.mongodb.com/products/charts) dashboards with the Coronavirus dataset.

> - Check out [Maxime's dashboard](https://charts.mongodb.com/charts-open-data-covid-19-zddgb/public/dashboards/60da4f45-f168-434a-82f6-d37ce88ff9ea).
> - Check out Thomas's dashboard (not supported anymore).

Here is an example of the charts we made using the Coronavirus dataset. More below and in the MongoDB Charts dashboards.

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-4266-8264-d37ce88ff9fa theme=light autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-479c-83b2-d37ce88ffa07 theme=dark autorefresh=3600}

## Let The Data Speak

We have to make decisions at work every day.

- Should we discontinue this project?
- Should we hire more people?
- Can we invest more in this branch? How much?

Leaders make decisions. Great leaders make informed decisions, based on facts backed by data and not just based on assumptions, feelings or opinions.

The management of the Coronavirus outbreak obeys the same rules. To make the right decisions, we need accurate data.

Data about the Coronavirus is relatively easy to find. The [Johns Hopkins University](https://www.jhu.edu/) has done a terrific job at gathering, cleaning and curating data from various sources. They wrote [an excellent blog post](https://systems.jhu.edu/research/public-health/ncov/) which I encourage you to read.

Having data is great but it can also be overwhelming. That's why data visualisation is also very important. Data alone doesn't speak and doesn't help make informed decisions.

[Johns Hopkins University](https://www.jhu.edu/) also did a great job on this part because they provided [this dashboard](https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6) to make this data more human accessible.

This is great... But we can do even better visualisations with [MongoDB Charts](https://www.mongodb.com/products/charts).

## Free Your Data With MongoDB Charts

[Thomas Rueckstiess](https://www.linkedin.com/in/rueckstiess/) and I imported all the data from Johns Hopkins University (and we will keep importing new data as they are published) into a MongoDB database. If you are interested by the data import, you can check my [Github repository](https://github.com/mongodb-developer/open-data-covid-19).

Then we used this data to produce a dashboard to monitor the progression of the virus.

> Here is [Maxime's dashboard](https://charts.mongodb.com/charts-open-data-covid-19-zddgb/public/dashboards/60da4f45-f168-434a-82f6-d37ce88ff9ea). It's shared publicly for the greater good.

[MongoDB Charts](https://www.mongodb.com/products/charts) also allows you to embed easily charts within a website... or a blog post.

Here are a few of the graphs I was able to import in here with just two clicks.


:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-4593-8e0e-d37ce88ffa15 theme=dark autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-43e7-8a6d-d37ce88ffa30 theme=light autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-42b4-8b88-d37ce88ffa3a theme=light autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-44c9-87f5-d37ce88ffa34 theme=light autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-41a8-8106-d37ce88ffa2c theme=dark autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-4cdc-8686-d37ce88ff9fc theme=dark autorefresh=3600}

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-47fd-88bd-d37ce88ffa0d theme=light autorefresh=3600 width=760 height=1000}

As you can see, [MongoDB Charts](https://www.mongodb.com/products/charts) is really powerful and super easy to embed.

## Participation

If you have a source of data that provides different or more accurate data about this virus. Please let me know on Twitter [@MBeugnet](https://twitter.com/mbeugnet) or in the [MongoDB community website](https://community.mongodb.com/). I will do my best to update this data and provide more charts.

## Sources

- [MongoDB Open Data COVID-19 - Blog Post](https://developer.mongodb.com/article/johns-hopkins-university-covid-19-data-atlas).
- [MongoDB Open Data COVID-19 - Github Repo](https://github.com/mongodb-developer/open-data-covid-19).
- [Dashboard](https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6) from [Johns Hopkins University](https://www.jhu.edu/).
- [Blog post from Johns Hopkins University](https://systems.jhu.edu/research/public-health/ncov/).
- [Public Google Spreadsheet (old version) - deprecated](https://docs.google.com/spreadsheets/d/1yZv9w9zRKwrGTaR-YzmAqMefw4wMlaXocejdxZaTs6w/htmlview?usp=sharing&sle=true#).
- [Public Google Spreadsheet (new version) - deprecated](https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/edit?usp=sharing).
- [Public Google Spreadsheet (Time Series) - deprecated](https://docs.google.com/spreadsheets/d/1UF2pSkFTURko2OvfHWWlFpDFAr1UxCBA4JLwlSP6KFo/edit?usp=sharing).
- [GitHub Repository with CSV dataset from Johns Hopkins University](https://github.com/CSSEGISandData/COVID-19).
- Image credit: [Scientific Animations](http://www.scientificanimations.com/wiki-images/) (CC BY-SA 4.0).
