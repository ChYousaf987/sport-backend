const validateEvent = (req, res, next) => {
  console.log('validateEvent - req.body:', req.body);
  console.log('validateEvent - req.files:', req.files);

  const requiredFields = [
    'eventTitle',
    'description',
    'date',
    'time',
    'location',
    'sport',
    'organizerName',
    'organizerGender',
    'contactNumber1',
    'country',
    'city',
    'teamSizeLimit',
    'maxPlayersPerTeam',
    'category',
    'type',
    'registrationLimit',
    'playerGender',
    'age',
    'registrationFee',
    'eventFeeMethod',
    'userId',
  ];

  const missingFields = requiredFields.filter(
    (field) => !req.body[field] || req.body[field].toString().trim() === ''
  );
  if (missingFields.length > 0) {
    console.log('Validation failed - Missing or empty fields:', missingFields);
    return res.status(400).json({
      message: 'Missing or empty required fields',
      errors: missingFields.map((field) => ({ field, message: `${field} is required` })),
    });
  }

  // Validate numeric fields
  const numericFields = [
    { name: 'teamSizeLimit', value: req.body.teamSizeLimit, min: 1 },
    { name: 'maxPlayersPerTeam', value: req.body.maxPlayersPerTeam, min: 1 },
    { name: 'registrationLimit', value: req.body.registrationLimit, min: 1 },
    { name: 'age', value: req.body.age, min: 1 },
    { name: 'registrationFee', value: req.body.registrationFee, min: 0 },
  ];
  for (const { name, value, min } of numericFields) {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < min) {
      console.log(`Validation failed - ${name}:`, value);
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ field: name, message: `${name} must be a ${min === 0 ? 'non-negative' : 'positive'} number` }],
      });
    }
  }

  // Validate userId format
  if (!/^[0-9a-fA-F]{24}$/.test(req.body.userId)) {
    console.log('Validation failed - userId:', req.body.userId);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'userId', message: 'userId must be a valid MongoDB ObjectId' }],
    });
  }

  // Validate phone number format
  if (!/^\d{10,15}$/.test(req.body.contactNumber1)) {
    console.log('Validation failed - contactNumber1:', req.body.contactNumber1);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'contactNumber1', message: 'contactNumber1 must be 10-15 digits' }],
    });
  }
  if (req.body.contactNumber2 && !/^\d{10,15}$/.test(req.body.contactNumber2)) {
    console.log('Validation failed - contactNumber2:', req.body.contactNumber2);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'contactNumber2', message: 'contactNumber2 must be 10-15 digits or empty' }],
    });
  }

  // Validate enum fields
  const validSports = ['Football', 'Basketball', 'Tennis', 'Cricket'];
  if (!validSports.includes(req.body.sport)) {
    console.log('Validation failed - sport:', req.body.sport);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'sport', message: `sport must be one of: ${validSports.join(', ')}` }],
    });
  }

  const validGenders = ['Male', 'Female', 'Other'];
  if (!validGenders.includes(req.body.organizerGender)) {
    console.log('Validation failed - organizerGender:', req.body.organizerGender);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'organizerGender', message: `organizerGender must be one of: ${validGenders.join(', ')}` }],
    });
  }

  const validCategories = ['Amateur', 'Professional', 'Recreational', 'Competitive'];
  if (!validCategories.includes(req.body.category)) {
    console.log('Validation failed - category:', req.body.category);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'category', message: `category must be one of: ${validCategories.join(', ')}` }],
    });
  }

  const validTypes = ['Tournament', 'League', 'Friendly', 'Training'];
  if (!validTypes.includes(req.body.type)) {
    console.log('Validation failed - type:', req.body.type);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'type', message: `type must be one of: ${validTypes.join(', ')}` }],
    });
  }

  const validPlayerGenders = ['Male', 'Female', 'Mixed', 'Any'];
  if (!validPlayerGenders.includes(req.body.playerGender)) {
    console.log('Validation failed - playerGender:', req.body.playerGender);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'playerGender', message: `playerGender must be one of: ${validPlayerGenders.join(', ')}` }],
    });
  }

  const validFeeMethods = ['Per Team', 'Per Player', 'Free'];
  if (!validFeeMethods.includes(req.body.eventFeeMethod)) {
    console.log('Validation failed - eventFeeMethod:', req.body.eventFeeMethod);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'eventFeeMethod', message: `eventFeeMethod must be one of: ${validFeeMethods.join(', ')}` }],
    });
  }

  // Validate date
  const parsedDate = new Date(req.body.date);
  if (isNaN(parsedDate.getTime())) {
    console.log('Validation failed - date:', req.body.date);
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'date', message: 'Invalid date format' }],
    });
  }

  next();
};

module.exports = { validateEvent };