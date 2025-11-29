export function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.userEmail) return next();
  
  if (req.session) req.session.errorMessage = 'Please log in to access that page.';
  return res.redirect('/login');
}
