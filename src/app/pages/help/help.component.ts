import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  panels = [
    {
      question: "HELP.QUESTION1",
      answer: "HELP.REPONSE1"
    },
    {
      question: "HELP.QUESTION2",
      answer: "HELP.REPONSE2"
    },
    {
      question: "HELP.QUESTION3",
      answer: "HELP.REPONSE3"
    },
    {
      question: "HELP.QUESTION4",
      answer: "HELP.REPONSE4"
    },
    {
      question: "HELP.QUESTION5",
      answer: "HELP.REPONSE5"
    },
    {
      question: "HELP.QUESTION6",
      answer: "HELP.REPONSE6"
    },
    {
      question: "HELP.QUESTION7",
      answer: "HELP.REPONSE7"
    },
    {
      question: "HELP.QUESTION8",
      answer: "HELP.REPONSE8"
    },
    {
      question: "HELP.QUESTION9",
      answer: "HELP.REPONSE9"
    },
    {
      question: "HELP.QUESTION10",
      answer: "HELP.REPONSE10"
    },
    {
      question: "HELP.QUESTION11",
      answer: "HELP.REPONSE11"
    },
    {
      question: "HELP.QUESTION12",
      answer: "HELP.REPONSE12"
    },
    {
      question: "HELP.QUESTION13",
      answer: "HELP.REPONSE13"
    },
    {
      question: "HELP.QUESTION14",
      answer: "HELP.REPONSE14"
    }
  ];
  constructor(public sessionService: SessionService, private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.updateMeta('help');
  }
}
