function renderWithDefaults(req, res, name, values={}) {
  if (req.user == undefined) {
    values.user = 'None';
  } else {
    values.user = req.user;
  }
  res.render(name, values);
}

exports.renderWithDefaults = renderWithDefaults;