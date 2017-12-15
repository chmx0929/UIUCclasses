import java.io.*;
import java.util.*;
import java.lang.*;
public class Main
{
public static void main(String args[]) throws Exception
	{
		Scanner cin=new Scanner(System.in);
		int counter=cin.nextInt();
		for (int i=0; i<counter; i++) 
		{
			double r=cin.nextDouble();
			double e=cin.nextDouble();
			double c=cin.nextDouble();
			if (r<(e-c)) 
			{
				System.out.println("advertise");
			}else if (r>(e-c)) {
				System.out.println("do not advertise");
			}else{
				System.out.println("does not matter");
			}
		}
	}
}