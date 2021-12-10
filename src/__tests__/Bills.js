import { screen } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage";
import { bills } from "../fixtures/bills.js"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills";
import firebase from "../__mocks__/firebase";
import Firestore from "../app/Firestore.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Router from "../app/Router";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html

      expect(screen.getAllByText("Loading...")).toBeTruthy()
    })
  })

  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      const html = BillsUI({ error: "some error message" })
      document.body.innerHTML = html

      expect(screen.getAllByText("Erreur")).toBeTruthy()
    })
  })

  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({ data: bills })

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
    })

    test("Then bill icon in vertical layout should be highlighted", () => {
      //jest.mock("firestore")
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() })
      const html = BillsUI({ data: [bills] })

      // sets the "Bills" path
      const pathname = ROUTES_PATH["Bills"];
      Object.defineProperty(window, "location", { value: { hash: pathname } })
	    
      // sets the "Employee" user type
      window.localStorage.setItem(
        "user",
        JSON.stringify({
        type: "Employee",
        email: "bou@bou",
        password: "##",
        status: "connected"        
        })
      )
      document.body.innerHTML = `<div id="root">${html}</div>`
      // launch route
      Router()
	    expect(screen.getByTestId("icon-window").classList).toContain("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the icon-eye of a bill", () => {
      test("A modal should open", () => {
        // build user interface
        const html = BillsUI({
          data: bills
        });
        document.body.innerHTML = html;
  
        // Init firestore
        const firestore = null;
        // Init Bills
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });
  
        // Mock modal behaviour
        $.fn.modal = jest.fn();
  
        // Get button eye in DOM
        const eye = screen.getAllByTestId("icon-eye")[0];
  
        // Mock function handleClickIconEye
        const handleClickIconEye = jest.fn(() =>
          allBills.handleClickIconEye(eye)
        );
  
        // Add Event and fire
        eye.addEventListener("click", handleClickIconEye);
        userEvent.click(eye);
  
        // handleClickIconEye function must be called
        expect(handleClickIconEye).toHaveBeenCalled();
        const modale = document.getElementById("modaleFile");
        // The modal must be present
        expect(modale).toBeTruthy();
      });

      describe("When the modal displays an image", () => {
        test("Then, image should display", () => {
        // expect src to be not "null"
        // build user interface
        const html = BillsUI({
          data: bills
        });
        document.body.innerHTML = html;
  
        // Init firestore
        const firestore = null;
        // Init Bills
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });
  
        // Mock modal comportment
        $.fn.modal = jest.fn();
  
        // Get button eye in DOM
        const eye = screen.getAllByTestId("icon-eye")[0];
  
        // Mock function handleClickIconEye
        const handleClickIconEye = jest.fn(() =>
          allBills.handleClickIconEye(eye)
        );

        const mock = jest.fn().mockReturnValue(2)
        console.log(handleClickIconEye(eye))
  
        // Add Event and fire
        eye.addEventListener("click", handleClickIconEye);
        userEvent.click(eye);
  
        // handleClickIconEye function must be called
        expect(handleClickIconEye).toHaveBeenCalled();
        const modaleImgSource = document.querySelector("#modaleFile img").src;
        // The modal must be present
        expect(modaleImgSource).not.toBe(null);
        })
      })

    })

    describe("When I click on the New bill button", () => {
      test("Then I should be redirected to new bill form", () => {
        const billsContainer = new Bills({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })

        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
        const newBillButton = screen.getByTestId("btn-new-bill")
        newBillButton.addEventListener("click", handleClickNewBill)
        userEvent.click(newBillButton)

        expect(handleClickNewBill).toHaveBeenCalled()
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      })
    })
  })

})

// test GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");

      // Get bills and the new bill
      const bills = await firebase.get();

      // getSpy must have been called once
      expect(getSpy).toHaveBeenCalledTimes(1);

      // The number of bills must be 4
      expect(bills.data.length).toBe(4);
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 404/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 500"
      });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 500/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });
  });
});