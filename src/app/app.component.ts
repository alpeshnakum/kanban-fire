import { Component } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import {
  TaskDialogResult,
  TaskDialogComponent,
} from './task-dialog/task-dialog.component';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

let deferredPrompt: any;

const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  todo = this.store
    .collection('todo')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  inProgress = this.store
    .collection('inProgress')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  done = this.store
    .collection('done')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  _platform: any;
  test_nothing: any;
  promptEvent: any;
  isIos_hide_button_chIOS: any;
  private _producturl = '../assets/products.json';
  data: any;

  constructor(
    private dialog: MatDialog,
    private store: AngularFirestore,
    private http: HttpClient
  ) {
    this.getinfojson()
    // const hostname = window.location.origin;
    // console.log('hostname ===== ', hostname);
    // const company_name = 'Kanbar-fire11111111111';
    // const manifest = {
    //   name: `${company_name}` || `kanban-fire-333333333`,
    //   short_name: `${company_name}` || `kanban-fire-333333333`,
    //   icons: [
    //     {
    //       src: hostname + '/assets/imgs/favicon/icon-192x192.png',
    //       sizes: '192x192',
    //       type: 'image/png',
    //     },
    //     {
    //       src: hostname + '/assets/imgs/favicon/icon-512x512.png',
    //       sizes: '512x512',
    //       type: 'image/png',
    //     },
    //   ],
    //   theme_color: '#ffffff',
    //   background_color: '#ffffff',
    //   display: 'standalone',
    //   start_url: hostname,
    // };
    // console.log('manifest ===== ', manifest);
    // const stringManifest = JSON.stringify(manifest);
    // console.log('stringManifest ===== ', stringManifest);
    // const blob = new Blob([stringManifest], { type: 'application/json' });
    // console.log('blob ===== ', blob);
    // const manifestURL = URL.createObjectURL(blob);
    // console.log('manifestURL ===== ', manifestURL);

    // document
    //   .querySelector("link[rel='manifest']")
    //   ?.setAttribute('href', manifestURL);
  }

  getinfojson(): Observable<any[]> {
    let params = new HttpParams().set('projectname', 'Sasi');

    this.http
      .get(this._producturl, { params: params })
      .subscribe((res: any) => {
        console.log('res111111111111 ===== ',res);
        this.data = res.product.find((data:any) => data.projectname === "Sasi" );
        console.log("ssssssssssssssssssssssssss",this.data);
      });
      console.log('this.data ===== ',this.data);
    return this.data;
  }

  manifestData: any = '0';
  chartOptions = {};

  ngOnInit() {

    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      this.setInstallable = true;
    });
    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('INSTALL: Success');
    });
    
    const templateString = `<h1>Hello {{name}}!</h1>`;
    
    this.isIos_hide_button_chIOS = /CriOS/i.test(navigator.userAgent);
    // alert(navigator.userAgent)
    console.warn(
      'this.isIos_hide_button_chIOS ===== ',
      this.isIos_hide_button_chIOS
    );

    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.promptEvent = null;
    }

    // this.updateManifest();

    this.http.get('manifest.webmanifest').subscribe((data) => {
      this.manifestData = data;
      console.log('data ===== ', data);
    });

    console.log('this.manifestData ===== ', this.manifestData);
  }

  showIosInstallModal(): boolean {
    // detect if the device is on iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // check if the device is in standalone mode
    const isInStandaloneMode = () => {
      return (
        'standalone' in (window as any).navigator &&
        (window as any).navigator.standalone
      );
    };
    console.log('isInStandaloneMode() ===== ', isInStandaloneMode());
    this.test_nothing = isInStandaloneMode();

    const shouldShowModalResponse = isIos() && !isInStandaloneMode();
    return shouldShowModalResponse;
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (!result) {
        return;
      }
      this.store.collection('todo').add(result.task);
    });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        this.store.collection(list).doc(task.id).delete();
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });
  }

  drop(event: CdkDragDrop<Task[] | null>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    if (!event.previousContainer.data || !event.container.data) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  isRunningStandalone() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  setInstallable: boolean = false;
  openPWA() {
    this.setInstallable = false;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    });
  }

  

  // makeApiCall() {
  //   this.http.get("https://discussion4all.com/digitalcircular/createpwa.php?endpoint=testing").subscribe(
  //     (response) => {
  //       console.log(response);
  //       // Handle the API response here
  //     },
  //     (error) => {
  //       console.error(error);
  //       // Handle any errors here
  //     }
  //   );
  // }

}
