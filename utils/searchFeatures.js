class SearchFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    search() {
        const keyword = this.queryString.keyword ? {
            name: {
                $regex: this.queryString.keyword,
                $options: "i",
            }
        } : {};

        // console.log(keyword);

        this.query = this.query.find({ ...keyword });
        return this;
    }

 filter() {
  const queryCopy = { ...this.queryStr };

  const removeFields = ["keyword", "page", "limit"];
  removeFields.forEach((key) => delete queryCopy[key]);

  // 🔥 CATEGORY FIX (case-insensitive)
  if (queryCopy.category) {
    queryCopy.category = {
      $regex: queryCopy.category,
      $options: "i",
    };
  }

  this.query = this.query.find(queryCopy);
  return this;
}


    pagination(resultPerPage) {
        const currentPage = Number(this.queryString.page) || 1;

        const skipProducts = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skipProducts);
        return this;
    }
};

module.exports = SearchFeatures;