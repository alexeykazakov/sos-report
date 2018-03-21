const form = document.forms.form_input;
const elem = form.elements;

let getLastWeekDate = function () {
  let date = new Date();
  date.setDate(date.getDate()-6);
  let year = date.getFullYear();
  let month = date.getMonth()+1;
  let day = date.getDate();

  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }

  let dt = year + '-' + month + '-' + day;

  elem.start.setAttribute('value', dt);
};

window.onload = function() {
  getLastWeekDate();
};

let clean_report = function(parent, child) {
  for (let i = 0; i < child.length; i++) {
    parent.removeChild(child[i]);
  }
};

let buildReport = function() {
  const done_list = document.getElementById('sos_done');
  // clean_report(done_list,done_list.getElementsByTagName('LI'));
  const doing_list = document.getElementById('sos_doing');
  // clean_report(doing_list,doing_list.getElementsByTagName('LI'));
  const dep_list = document.getElementById('sos_dep');
  // clean_report(dep_list,dep_list.getElementsByTagName('LI'));
  const blocker_list = document.getElementById('sos_blocker');
  // clean_report(blocker_list,blocker_list.getElementsByTagName('LI'));

  let pr_repo = elem.pr_repo.value.split(',');
  let issues_repo = elem.issues_repo.value.split(',');
  let start = elem.start.value;
  let team = elem.team.value;
  let sprint = elem.sprint.value;
  let done_query = `type:pr is:closed closed:>` + start;
  let done_issues_query = `type:issue is:closed closed:>` + start;
  let doing_query = `type:issue is:open milestone:"${sprint}"`;
  // let doing_query = `type:issue is:open label:${team} milestone:"${sprint}"`;
  let dep_query = `type:issue is:open label:${team} label:issue/crucial-dep `;
  let integration_query = `type:issue is:open label:${team} label:issue/integration`;
  let blocker_query = `type:issue is:open label:${team} label:issue/blocker`;

  let github_api_PR_repos=[];
  let github_api_issues_repos=[];

  pr_repo.forEach(function (repo) {
    github_api_PR_repos.push('https://api.github.com/search/issues?per_page=100&q=repo:'+repo+'+');
  });
  issues_repo.forEach(function (repo) {
    github_api_issues_repos.push('https://api.github.com/search/issues?per_page=100&q=repo:'+repo+'+');
  });

  let printPR = function(result) {
    let items = result.items;
    items.forEach(function (item) {
      let labels = ' ';
      let sb = 1;
      item.labels.forEach(function (label) {
        labels = labels + label.name + ', '
        sb = 2;
      });
      labels = labels.substring(0, labels.length-sb);
      if (labels.length>0) {
        labels = labels + ': '
      }
      let body = '';
      if (item.body && item.body !== '') {
        body = `
        <br>
        <ul style="list-style-type:circle">
          <li>${item.body}</li>
        </ul>
        `;
      }
      let title = item.title.split('):');
      done_list.insertAdjacentHTML('beforeend',`
        <li>
          <a href="${item.html_url}">#${item.number}</a> - <b>${labels}</b>${title[1]?title[1]:item.title}
        </li>
      `);
    });

  };

  let printIssues = function(result) {
    let items = result.items;
    items.forEach(function (item) {
      let labels = ' ';
      let sb = 1;
      item.labels.forEach(function (label) {
        labels = labels + label.name + ', '
        sb = 2;
      });
      labels = labels.substring(0, labels.length-sb);
      if (labels.length>0) {
        labels = labels + ': '
      }
      doing_list.insertAdjacentHTML('beforeend',`
        <li>
          <a href="${item.html_url}">#${item.number}</a> - <b>${labels}</b>${item.title}
        </li>
      `);
    });
  };

  let printDeps = function(result) {
    let items = result.items;
    items.forEach(function (item) {
      dep_list.insertAdjacentHTML('beforeend',`
        <li>
          <a href="${item.html_url}">#${item.number}</a> - ${item.title}
        </li>
      `);
    });
  };

  let printBlockers = function(result) {
    let items = result.items;
    items.forEach(function (item) {
      blocker_list.insertAdjacentHTML('beforeend',`
        <li>
          <a href="${item.html_url}">#${item.number}</a> - ${item.title}
        </li>
      `);
    });
  };

  let getReport = function(repo, query, print) {
    $.ajax(repo + query, {
      dataType: 'json'
    }).done(function(data) {
      print(data)
    })
  };

  github_api_PR_repos.forEach(function (repo) {
    getReport(repo, done_query, printPR);
  });
  github_api_PR_repos.forEach(function (repo) {
    getReport(repo, done_issues_query, printPR);
  });
  github_api_issues_repos.forEach(function (repo) {
    getReport(repo, doing_query, printIssues);
  });
  github_api_issues_repos.forEach(function (repo) {
    getReport(repo, dep_query, printDeps);
  });
  github_api_issues_repos.forEach(function (repo) {
    getReport(repo, integration_query, printDeps);
  });
  github_api_issues_repos.forEach(function (repo) {
    getReport(repo, blocker_query, printBlockers);
  });
};