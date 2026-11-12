// Route-parameter guard: malformed ids get a 404 instead of a database CastError (500).
const OBJECT_ID = /^[a-f\d]{24}$/i;

const validateObjectId = (req, res, next, value) => {
    if (!OBJECT_ID.test(String(value))) {
        return res.status(404).json({ message: 'Not found' });
    }
    next();
};

module.exports = validateObjectId;
