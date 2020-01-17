const Mysql = require('mysql');

class MysqlDB {
    constructor() {
        const conn = Mysql.createConnection({
            host: 'www.bantasy.top',
            user: 'root',
            password: '123456789',
            database: 'banyq'
        })
        conn.connect();

        this.db = conn;
    }

    createSql() {
        return new CreateSql(this.db);
    }

    close() {
        
    }
}

function parseWhere(wh, rel = 'and') {
    const tmp = [];
    for (let i in wh) {
        if (wh.hasOwnProperty(i)) {
            const r = wh[i];
            switch (i) {
                case 'and':
                    tmp.push(parseWhere(r, 'and'));
                break;
                case 'or':
                    tmp.push(parseWhere(r, 'or'));
                break;
                default:
                    let val = r, trel = '=';
                    if (typeof r == 'object') {
                        if (!r.val) throw new Error(`${i}'s val must not be null in where clause`)
                        trel = r.rel ? r.rel : '=';
                        if (typeof r.val == 'string') val = '"' + r.val + '"';
                        else val = r.val;
                    } else if (typeof r == 'string') val = '"' + r + '"';
                    tmp.push(`${i} ${trel} ${val}`);
            }
        }
    }
    if (tmp.length > 0) return `(${tmp.join(' ' + rel + ' ')})`;
    return ''
}

class CreateSql {
    constructor(db) {
        this.db = db;
        this.sql = '';
        this.wh = {};   // where
        this.cols = ['*'];
        this.ord = [];
        this.lin = null;
        this.type = '';
        this.tb = '';
        this.vals = null;
        this.fs = null;   // update fields
        this.sqlParams = []
    }

    exec() {
        const sql = this.compile();
        return new Promise((resolve, reject) => {
            this.db.query(sql, (err, result, fields) => {
                if (err) reject(err);
                else resolve({result, fields});
            })
        })
    }

    compile() {
        let where;
        switch (this.type) {
            case 'select':
                where = parseWhere(this.wh);
                if (where && where.length) where = ' where ' + where;
                else where = '';
                this.sql = `select ${this.cols.join(', ')} from ${this.tb}${where}${this.lim ? (' limit ' + this.lim[0] + ', ' + this.lim[1]) : ''}`
            break;
            case 'insert':
                if (!this.vals) throw new Error('insert values must not be null');
                if (this.cols.length == 1 && this.cols[0] == '*') this.cols = []
                const cols = this.cols.join(', ');
                const values = this.vals.map(e =>  '(' + e.map(x => typeof x != 'string' ? x : ('"' + x + '"')).join(',') + ')').join(', ');
                this.sql = `insert into ${this.tb} ${cols ? '(' + cols + ') ' : ''}values ${values}`
            break;
            case 'update':
                if (this.fs == null) throw new Error('update fields must not be null');
                where = parseWhere(this.wh);
                if (where && where.length) where = ' where ' + where;
                else where = '';
                let fields = [];
                for (let i in this.fs) {
                    fields.push(i + ' = ' + this.fs[i])
                }
                this.sql = `update ${this.tb} set ${fields.join(', ')}${where}`
            break;
            case 'delete':
                where = parseWhere(this.wh);
                if (where && where.length) where = ' where ' + where;
                else where = '';
                this.sql = `delete from ${this.tb}${where}`
            break;
            default:
                throw new Error('one of select(tableName), update(tableName), insert(tableName), delete(tableName) must be called');
        }
        console.log('generated sql: ', this.sql);
        return this.sql;
    }

    select(table) {
        if (!this.type) this.type = 'select';
        else throw new Error('Sql already set type to ' + this.type);
        if (!table) throw new Error('select methods must specify a table name param')
        this.tb = table;
        return this;
    }

    insert(table) {
        if (!this.type) this.type = 'insert';
        else throw new Error('Sql already set type to ' + this.type);
        if (!table) throw new Error('insert methods must specify a table name param')
        this.tb = table;
        return this;
    }

    delete(table) {
        if (!this.type) this.type = 'delete';
        else throw new Error('Sql already set type to ' + this.type);
        if (!table) throw new Error('delete methods must specify a table name param')
        this.tb = table;
        return this;
    }

    update(table) {
        if (!this.type) this.type = 'update';
        else throw new Error('Sql already set type to ' + this.type);
        if (!table) throw new Error('update methods must specify a table name param')
        this.tb = table;
        return this;
    }

    column(cols = ['*']) {
        if (!cols instanceof Array) throw new Error('params cols must be instanceof Array');
        this.cols = cols;
        return this;
    }

    where(wh = {}) {
        if (typeof wh != 'object') throw new Error('where must be instanceof Object');
        this.wh = wh;
        return this;
    }

    order(ord = []) {
        this.ord = ord;
        return this;
    }

    limit(lim = [1, 10]) {
        if (!lim instanceof Array || lim.length != 2) throw new Error('limit must be instanceof Array like [1, 10]');
        this.lim = lim;
        return this;
    }

    values(vals) {
        if (!vals instanceof Array && typeof vals != 'object') throw new Error('values must be a type of Object or Arrray');
        else if(!vals instanceof Array) vals = [vals];
        this.vals = vals;
        return this;
    }

    fields(fs) {
        if (typeof fs != 'object') throw new Error('fields must be a type of Object');
        this.fs = fs;
        return this;
    }
}

(() => {
    const myDb = new MysqlDB();
    // myDb.createSql().insert('user').column(['name', 'password', 'token_version', 'auth_lv', 'sign', 'avatar', 'descr']).values([
    //     ['banyq2', 'qweqwewqwe', 0, -1, 'a.png', 'Hello world', 'a test account'],
    //     ['banyq3', 'qweqwewqwe', 0, -1, 'a.png', 'Hello world', 'a test account'],
    //     ['banyq4', 'qweqwewqwe', 0, -1, 'a.png', 'Hello world', 'a test account'],
    //     ['banyq5', 'qweqwewqwe', 0, -1, 'a.png', 'Hello world', 'a test account']
    // ]).exec().then(data => {
    //     console.log(data.result);
    // }).catch(err => {
    //     console.error(err);
    // })
    myDb.createSql().select('user').where({
        or: {
            name: 'banyq',
            or: {
                name: 'banyq1'
            }
        }
    }).exec().then(data => {
        console.log(data.result);
    }).catch(err => {
        console.error(err);
    })
})()