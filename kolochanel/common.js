function renderWithDefaults(req, res, name, values={}) {
  if (req.user == undefined) {
    values.user = 'None';
  } else {
    values.user = req.user;
  }

  console.log(values)
  res.render(name, values);
}

exports.renderWithDefaults = renderWithDefaults;