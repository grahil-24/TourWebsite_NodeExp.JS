class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //1.A)Filtering
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        //1.B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        //we want to replace gte, gt, lte, lt
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        console.log(JSON.parse(queryStr));

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.toString().split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            //- prefix means to exclude that field. and - in sort means descending order
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; //if there is no specified page then default will be 1.
        const limit = this.queryString.limit * 1 || 100; //default 100
        const skip = (page - 1) * limit;

        //shows 10 results. skip() means amount of results to be skipped before querying the data
        //page=2&limit=10 page 1 1-10, page 2 11-20
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
