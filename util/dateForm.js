const dateForm = (data) => {
  const year = String(data.getFullYear());
  const month = String(data.getMonth() + 1).padStart(2, "0");
  const date = String(data.getDate()).padStart(2, "0");

  const weekday = new Array(7);
  weekday[0] = "Sun";
  weekday[1] = "Mon";
  weekday[2] = "Tue";
  weekday[3] = "Wed";
  weekday[4] = "Thu";
  weekday[5] = "Fri";
  weekday[6] = "Sat";

  const day = weekday[data.getDay()];

  const selectedDate = `${year}-${month}-${date}-${day}`;

  return selectedDate;
};

module.exports = dateForm;
